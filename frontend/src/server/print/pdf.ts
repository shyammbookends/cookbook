import "server-only";
import type { Browser } from "puppeteer-core";
import { buildRecipePrintDocument, pdfFileName, type PrintRecipe } from "@/lib/recipe-print";
import { readStoredFile } from "@/server/media/storage";
import { localRead } from "@/server/media/localfs";
import type { PrintData } from "@/server/print/data";

/**
 * Server-side PDF rendering with headless Chromium: the same printable HTML the
 * browser used to print, turned into a real (vector, searchable) A4 PDF.
 * On Vercel the Chromium binary comes from @sparticuz/chromium; locally the
 * Playwright-installed Chromium (or CHROME_EXECUTABLE_PATH) is used.
 */

async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (await import("playwright-core")).chromium.executablePath();
  return puppeteer.launch({ executablePath, headless: true });
}

/**
 * Swap /media/... photo URLs for inline JPEG data URLs, so Chromium needs no HTTP
 * round trips (or auth) to our own site. JPEG matters: Chromium copies JPEG bytes
 * straight into the PDF, but stores WebP losslessly (~10x larger files).
 */
async function inlineImages(recipes: PrintRecipe[]): Promise<void> {
  const sharp = (await import("sharp")).default;
  await Promise.all(
    recipes.map(async (r) => {
      if (!r.heroImageUrl?.startsWith("/media/")) return;
      const key = r.heroImageUrl.slice(1);
      try {
        const data = (await readStoredFile(key))?.data ?? (await localRead(key));
        const jpeg = data ? await sharp(data).resize({ width: 1100, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer() : null;
        r.heroImageUrl = jpeg ? `data:image/jpeg;base64,${jpeg.toString("base64")}` : null;
      } catch (err) {
        console.error("pdf image inline failed", key, err instanceof Error ? err.message : err);
        r.heroImageUrl = null;
      }
    }),
  );
}

export function printFileName(data: PrintData): string {
  if (data.kind === "cookbook") return pdfFileName(data.brandName, "Master Cookbook");
  if (data.kind === "recipe") return pdfFileName(data.brandName, data.recipes[0]?.title ?? "Recipe");
  return pdfFileName(data.brandName, data.categoryName ?? "Recipes");
}

export async function renderPrintPdf(data: PrintData): Promise<Uint8Array> {
  await inlineImages(data.kind === "cookbook" ? data.categories.flatMap((c) => c.recipes) : data.recipes);

  const html =
    data.kind === "cookbook"
      ? buildRecipePrintDocument({
          title: `${data.brandName} - Master Cookbook`,
          brandName: data.brandName,
          recipes: [],
          template: data.template,
          cookbook: { categories: data.categories },
        })
      : buildRecipePrintDocument({
          title: printFileName(data).replace(/\.pdf$/, ""),
          brandName: data.brandName,
          recipes: data.recipes,
          template: data.template,
          collection:
            data.kind === "category"
              ? { categoryName: data.categoryName ?? "", number: data.categoryNumber, description: data.categoryDescription }
              : undefined,
        });

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 860, height: 1200 });
    // Photos are inline data URLs; web fonts are awaited by FIT_SCRIPT (document.fonts.ready).
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    // FIT_SCRIPT (recipe-print.ts) scales every card to exactly one A4 page once fonts/images are in.
    await page.waitForFunction("window.__recipePrintDone === true", { timeout: 30_000 }).catch(() => {});
    return await page.pdf({ printBackground: true, preferCSSPageSize: true, timeout: 120_000 });
  } finally {
    for (const p of await browser.pages().catch(() => [])) await p.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
