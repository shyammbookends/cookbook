// import "server-only";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { UploadError } from "@/server/media/errors";
import { MAX_UPLOAD_BYTES } from "@/server/media/pipeline";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

// RFC1918 + loopback + link-local + cloud metadata endpoint.
function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip === "169.254.169.254") return true; // cloud metadata service
  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true; // ULA / link-local v6
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new UploadError("That image host is not allowed.");
    return;
  }
  const results = await lookup(hostname, { all: true });
  for (const r of results) {
    if (isPrivateIp(r.address)) throw new UploadError("That image host resolves to a private address and is not allowed.");
  }
}

/**
 * Downloads an admin- or Excel-supplied image URL into our own storage
 * rather than hotlinking. SSRF-guarded: https only, blocks private/loopback/
 * link-local/cloud-metadata IPs (checked both before and after redirects),
 * caps redirects, enforces a timeout and a size limit, and requires an
 * image content-type in the response.
 */
export async function fetchImageFromUrl(url: string): Promise<Buffer> {
  let current = new URL(url);
  if (current.protocol !== "https:") {
    throw new UploadError("Image URLs must use https://.");
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual", signal: controller.signal });
    } catch {
      throw new UploadError("Could not reach that image URL.");
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = new URL(res.headers.get("location")!, current);
      if (next.protocol !== "https:") throw new UploadError("Redirected to a non-https URL.");
      current = next;
      continue;
    }

    if (!res.ok) throw new UploadError(`Image URL returned ${res.status}.`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new UploadError(`Expected an image, got "${contentType || "unknown"}".`);
    }

    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > MAX_UPLOAD_BYTES) {
      throw new UploadError("Image is too large.");
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_UPLOAD_BYTES) {
      throw new UploadError("Image is too large.");
    }
    return buf;
  }

  throw new UploadError("Too many redirects.");
}
