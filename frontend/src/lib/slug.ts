import slugify from "slugify";

/** Turns any title (including Hindi/Gujarati text) into a URL-safe slug. */
export function toSlug(input: string): string {
  const base = slugify(input, { lower: true, strict: true, trim: true });
  return base || "recipe";
}

/** Appends -2, -3, … until `isTaken` returns false. */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = toSlug(base);
  let candidate = root;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
