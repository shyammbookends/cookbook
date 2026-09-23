"use client";

import { useState } from "react";
import type { RecipeDetailData } from "@/server/public/recipes";

function formatQty(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function IngredientList({ ingredients, baseServings }: { ingredients: RecipeDetailData["ingredients"]; baseServings: number | null }) {
  const [servings, setServings] = useState(baseServings ?? 0);
  const factor = baseServings && servings ? servings / baseServings : 1;

  const groups = new Map<string, typeof ingredients>();
  for (const ing of ingredients) {
    const key = ing.groupLabel ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  return (
    <div>
      {baseServings ? (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className="text-brand-fg/60">Servings</span>
          <button
            type="button"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="h-7 w-7 rounded-full border border-brand-fg/30 hover:border-brand-accent"
            aria-label="Decrease servings"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{servings}</span>
          <button
            type="button"
            onClick={() => setServings((s) => s + 1)}
            className="h-7 w-7 rounded-full border border-brand-fg/30 hover:border-brand-accent"
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
      ) : null}

      {[...groups.entries()].map(([label, lines]) => (
        <div key={label} className="mb-6">
          {label && <h3 className="eyebrow mb-3 text-brand-accent">{label}</h3>}
          <ul className="space-y-2">
            {lines.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2 border-b border-brand-fg/10 pb-2 text-sm">
                <span className="w-20 shrink-0 font-semibold tabular-nums">
                  {i.quantity != null ? `${formatQty(Number(i.quantity) * factor)}${i.quantityMax ? `–${formatQty(Number(i.quantityMax) * factor)}` : ""} ${i.unit ?? ""}` : ""}
                </span>
                <span>
                  {i.name}
                  {i.note ? <span className="text-brand-fg/50"> ({i.note})</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
