/**
 * Extra SOP panels — sub-recipes, sauce references, notes — stored as plain
 * text on Recipe.sopSections so they can be typed in the editor or an Excel
 * cell. One panel per `#` line:
 *
 *   # SAUCE REFERENCE // (CORN ROCKS SAUCE) @side
 *   * Ingredients | Gram        header row
 *   Mayonnaise | 40             row (label | value)
 *   TOTAL | 244 g               TOTAL / WASTAGE rows are emphasised
 *   ## SICHUAN SOY GLAZE        gold sub-heading
 *   > Whisk until smooth.       italic note
 *   - Serve hot.                bullet
 *   Any other line              paragraph
 *
 * `@place` picks where a panel sits on the card: `side` (default, a column
 * after the method), `mid` (between ingredients and method), `lead` (before
 * the ingredients), `above` / `below` (stacked in the ingredients column, above
 * or below the ingredient list) or `bottom` (a row under the columns).
 */

export type SopPlacement = "lead" | "mid" | "side" | "bottom" | "above" | "below";

export type SopItem =
  | { kind: "head"; label: string; value: string }
  | { kind: "row"; label: string; value: string; strong: boolean }
  | { kind: "sub"; text: string }
  | { kind: "note"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

export interface SopSection {
  title: string;
  subtitle: string | null;
  place: SopPlacement;
  items: SopItem[];
}

const PLACES: SopPlacement[] = ["lead", "mid", "side", "bottom", "above", "below"];
const STRONG_ROW = /^(total|wastage)\b/i;

function splitRow(line: string): [string, string] {
  const i = line.lastIndexOf("|");
  return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
}

export function parseSopSections(text: string | null | undefined): SopSection[] {
  const sections: SopSection[] = [];
  let current: SopSection | null = null;

  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (/^#(?!#)/.test(line)) {
      let head = line.replace(/^#\s*/, "");
      let place: SopPlacement = "side";
      const at = head.match(/(?:^|\s)@(\w+)\s*$/);
      if (at && PLACES.includes(at[1] as SopPlacement)) {
        place = at[1] as SopPlacement;
        head = head.slice(0, at.index).trim();
      }
      const [title, subtitle] = head.split("//").map((s) => s.trim());
      current = { title, subtitle: subtitle || null, place, items: [] };
      sections.push(current);
      continue;
    }

    // Content before any "#" line gets an untitled side panel.
    if (!current) {
      current = { title: "", subtitle: null, place: "side", items: [] };
      sections.push(current);
    }

    if (line.startsWith("##")) current.items.push({ kind: "sub", text: line.replace(/^##\s*/, "") });
    else if (line.startsWith(">")) current.items.push({ kind: "note", text: line.replace(/^>\s*/, "") });
    else if (/^[-•]\s/.test(line)) current.items.push({ kind: "bullet", text: line.replace(/^[-•]\s*/, "") });
    else if (line.startsWith("*") && line.includes("|")) {
      const [label, value] = splitRow(line.replace(/^\*\s*/, ""));
      current.items.push({ kind: "head", label, value });
    } else if (line.includes("|")) {
      const [label, value] = splitRow(line);
      current.items.push({ kind: "row", label, value, strong: STRONG_ROW.test(label) });
    } else current.items.push({ kind: "text", text: line });
  }

  // "Total" is only a closing row when nothing but other closing rows follow it
  // (a "Total | 2 days CF" line inside a facts table stays plain).
  for (const s of sections) {
    s.items.forEach((it, i) => {
      if (it.kind !== "row" || !it.strong) return;
      const next = s.items[i + 1];
      if (next && next.kind === "row" && !next.strong) it.strong = false;
    });
  }

  return sections;
}

/** Ingredient rows that close a list (TOTAL / WASTAGE) are emphasised the same way. */
export const isTotalRow = (label: string) => STRONG_ROW.test(label.trim());
