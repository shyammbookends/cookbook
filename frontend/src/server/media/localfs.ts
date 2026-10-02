import "server-only";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";

/** Dev-only disk access (STORAGE_DRIVER=local). Never used on Vercel/production. */
function root(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_LOCAL_DIR ?? "./.media");
}

function resolveKey(key: string): string | null {
  const r = root();
  const file = path.resolve(/* turbopackIgnore: true */ r, key);
  return file.startsWith(r + path.sep) ? file : null;
}

export async function localPut(key: string, data: Buffer): Promise<void> {
  const file = resolveKey(key);
  if (!file) throw new Error("Invalid storage key.");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

export async function localRemove(key: string): Promise<void> {
  const file = resolveKey(key);
  if (file) await unlink(file).catch(() => {});
}

export async function localRead(key: string): Promise<Buffer | null> {
  const file = resolveKey(key);
  return file ? readFile(file).catch(() => null) : null;
}
