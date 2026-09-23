import { describe, it, expect } from "vitest";
import { parseIngredientLine, parseIngredientBlock, parseStepBlock } from "@/lib/ingredientParser";

describe("parseIngredientLine", () => {
  it("parses quantity, unit, name and a trailing comma note", () => {
    const r = parseIngredientLine("200g flour, sifted");
    expect(r.quantity).toBe(200);
    expect(r.unit).toBe("g");
    expect(r.name).toBe("flour");
    expect(r.note).toBe("sifted");
  });

  it("parses a range", () => {
    const r = parseIngredientLine("2-3 tbsp olive oil");
    expect(r.quantity).toBe(2);
    expect(r.quantityMax).toBe(3);
    expect(r.unit).toBe("tbsp");
    expect(r.name).toBe("olive oil");
  });

  it("parses a unicode fraction", () => {
    const r = parseIngredientLine("½ tsp salt");
    expect(r.quantity).toBe(0.5);
    expect(r.unit).toBe("tsp");
    expect(r.name).toBe("salt");
  });

  it("parses a mixed number", () => {
    const r = parseIngredientLine("1 1/2 cups sugar");
    expect(r.quantity).toBe(1.5);
    expect(r.unit).toBe("cups");
  });

  it("handles a line with no quantity", () => {
    const r = parseIngredientLine("Salt to taste");
    expect(r.quantity).toBeNull();
    expect(r.name).toBe("Salt to taste");
  });

  it("parses a parenthetical note", () => {
    const r = parseIngredientLine("2 eggs (room temperature)");
    expect(r.quantity).toBe(2);
    expect(r.name).toBe("eggs");
    expect(r.note).toBe("room temperature");
  });
});

describe("parseIngredientBlock", () => {
  it("splits groups on ## headers", () => {
    const groups = parseIngredientBlock("## Dough\n500g flour\n1 tsp salt\n## Topping\n200g cheese");
    expect(groups).toHaveLength(2);
    expect(groups[0].groupLabel).toBe("Dough");
    expect(groups[0].lines).toHaveLength(2);
    expect(groups[1].groupLabel).toBe("Topping");
    expect(groups[1].lines).toHaveLength(1);
  });

  it("strips bullet and numbered prefixes", () => {
    const groups = parseIngredientBlock("- 200g flour\n1. 1 egg\n* 2 tbsp oil");
    expect(groups[0].lines.map((l) => l.name)).toEqual(["flour", "egg", "oil"]);
  });
});

describe("parseStepBlock", () => {
  it("splits on newlines and strips step prefixes", () => {
    const steps = parseStepBlock("Step 1: Mix the dough\n2. Let it rest\nBake at 250C");
    expect(steps).toEqual(["Mix the dough", "Let it rest", "Bake at 250C"]);
  });
});
