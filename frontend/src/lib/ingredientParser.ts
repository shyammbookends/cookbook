/**
 * Turns a free-text ingredient line into { quantity, unit, name, note }.
 * Used by both the admin "paste a list" box and the Excel importer, so both
 * paths produce identical structured data from the same raw text.
 *
 * Examples handled:
 *   "200g flour, sifted"        -> 200, g, flour, sifted
 *   "2-3 tbsp olive oil"        -> 2..3, tbsp, olive oil
 *   "1/2 tsp salt"              -> 0.5, tsp, salt
 *   "½ cup sugar"               -> 0.5, cup, sugar
 *   "Salt to taste"             -> null, null, "Salt to taste"
 *   "## For the sauce"          -> group header (handled by parseIngredientBlock)
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125,
};

const KNOWN_UNITS = [
  "g", "gram", "grams", "kg", "kilogram", "kilograms", "mg",
  "ml", "milliliter", "milliliters", "l", "liter", "liters", "litre", "litres",
  "tsp", "teaspoon", "teaspoons", "tbsp", "tablespoon", "tablespoons",
  "cup", "cups", "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds",
  "pinch", "pinches", "dash", "clove", "cloves", "slice", "slices",
  "piece", "pieces", "pc", "pcs", "can", "cans", "packet", "packets", "stick", "sticks",
  "bunch", "bunches", "sprig", "sprigs", "leaf", "leaves",
];
const UNIT_RE = new RegExp(`^(${KNOWN_UNITS.join("|")})\\.?$`, "i");

function parseNumberToken(token: string): number | null {
  if (!token) return null;
  if (UNICODE_FRACTIONS[token] !== undefined) return UNICODE_FRACTIONS[token];

  // "1½" style
  const mixedUnicode = token.match(/^(\d+)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛])$/);
  if (mixedUnicode) return Number(mixedUnicode[1]) + UNICODE_FRACTIONS[mixedUnicode[2]];

  // "1 1/2" already split by caller; handle "1/2" fraction
  const fraction = token.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
  return null;
}

export interface ParsedIngredientLine {
  quantity: number | null;
  quantityMax: number | null;
  unit: string | null;
  name: string;
  note: string | null;
  raw: string;
}

export function parseIngredientLine(rawInput: string): ParsedIngredientLine {
  const raw = rawInput.trim();
  let rest = raw;

  // Note in parentheses at the end: "flour (sifted)"
  let note: string | null = null;
  const parenNote = rest.match(/\(([^)]+)\)\s*$/);
  if (parenNote) {
    note = parenNote[1].trim();
    rest = rest.slice(0, parenNote.index).trim();
  }

  // Note after a comma: "flour, sifted"
  if (!note) {
    const commaIdx = rest.indexOf(",");
    if (commaIdx > -1 && commaIdx < rest.length - 1) {
      note = rest.slice(commaIdx + 1).trim();
      rest = rest.slice(0, commaIdx).trim();
    }
  }

  // Leading quantity: "2-3", "1 1/2", "1½", "½", "200"
  let quantity: number | null = null;
  let quantityMax: number | null = null;

  const rangeMatch = rest.match(/^(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*/i);
  if (rangeMatch) {
    quantity = Number(rangeMatch[1]);
    quantityMax = Number(rangeMatch[2]);
    rest = rest.slice(rangeMatch[0].length).trim();
  } else {
    const mixedMatch = rest.match(/^(\d+)\s+(\d+\/\d+)\s*/);
    if (mixedMatch) {
      quantity = Number(mixedMatch[1]) + (parseNumberToken(mixedMatch[2]) ?? 0);
      rest = rest.slice(mixedMatch[0].length).trim();
    } else {
      const singleMatch = rest.match(/^(\d+\/\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛]|\d+[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛])\s*/);
      if (singleMatch) {
        quantity = parseNumberToken(singleMatch[1]);
        rest = rest.slice(singleMatch[0].length).trim();
      }
    }
  }

  // Unit right after the quantity
  let unit: string | null = null;
  if (quantity !== null) {
    const unitMatch = rest.match(/^([a-zA-Z]+)\.?\s+/);
    if (unitMatch && UNIT_RE.test(unitMatch[1])) {
      unit = unitMatch[1].toLowerCase();
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  return {
    quantity,
    quantityMax,
    unit,
    name: rest || raw,
    note,
    raw,
  };
}

export interface ParsedIngredientGroup {
  groupLabel: string | null;
  lines: ParsedIngredientLine[];
}

/** Parses a full pasted block, splitting on newlines and honoring "## Group" headers. */
export function parseIngredientBlock(block: string): ParsedIngredientGroup[] {
  const groups: ParsedIngredientGroup[] = [{ groupLabel: null, lines: [] }];
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s*(.+)$/);
    if (headerMatch) {
      groups.push({ groupLabel: headerMatch[1].trim(), lines: [] });
      continue;
    }
    // Strip leading bullet/number markers: "- ", "* ", "1. "
    const cleaned = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
    groups[groups.length - 1].lines.push(parseIngredientLine(cleaned));
  }

  return groups.filter((g) => g.lines.length > 0);
}

/** Splits step text (one step per line, strips "Step 1:" / "1." prefixes). */
export function parseStepBlock(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^step\s*\d+\s*[:.)-]?\s*/i, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}
