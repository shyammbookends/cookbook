import type { ReactNode } from "react";
import type { SopTemplateKey } from "@/lib/sop/templates";
import type { AikoCardData } from "@/lib/sop/aiko";
import { RecipeSopView, type SopViewData } from "@/components/recipe/RecipeSopView";
import { AikoSopView } from "@/components/recipe/AikoSopView";
import { DessertSopView } from "@/components/recipe/DessertSopView";
import { isDessertStyle } from "@/lib/sop/dessert";
import { DimsumSopView } from "@/components/recipe/DimsumSopView";
import { isDimsumStyle } from "@/lib/sop/aiko-dimsum";
import { DrinkSopView } from "@/components/recipe/DrinkSopView";
import { isDrinksStyle } from "@/lib/sop/aiko-drinks";

export function toAikoCardData(d: SopViewData, heroUrl: string | null): AikoCardData {
  return {
    title: d.title,
    subtitle: d.subtitle ?? null,
    description: d.description,
    dishType: d.dishType ?? null,
    diet: d.diet,
    yieldText: d.yieldText,
    service: d.service ?? null,
    allergens: d.allergens,
    dishCode: d.dishCode,
    author: d.author,
    approvedBy: d.approvedBy,
    station: d.station,
    versionLabel: d.versionLabel,
    brandName: d.brandName,
    heroUrl,
    ingredients: d.ingredients,
    steps: d.steps,
    qualityCheck: d.qualityCheck,
    plating: d.plating,
    sopSections: d.sopSections ?? null,
    opts: d.aiko ?? null,
  };
}

/**
 * A recipe's SOP card in its brand's design. Every place that shows a recipe
 * card (public page, admin page, editor preview) goes through here.
 */
export function SopCard({
  template,
  data,
  hero,
  heroUrl,
  topSlot,
  headerAction,
  editable = false,
}: {
  template: SopTemplateKey;
  data: SopViewData;
  /** Rendered photo for the classic card. */
  hero: ReactNode;
  /** Photo URL for HTML-built cards (Aiko). */
  heroUrl: string | null;
  topSlot?: ReactNode;
  headerAction?: ReactNode;
  editable?: boolean;
}) {
  if (isDrinksStyle(template, data.categorySlug)) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-3 py-4 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        {(topSlot || headerAction) && (
          <div className="mx-auto mb-3 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
            <div>{topSlot}</div>
            {headerAction}
          </div>
        )}
        <DrinkSopView
          editable={editable}
          data={{
            title: data.title,
            description: data.description,
            heroUrl,
            ingredients: data.ingredients,
            steps: data.steps,
            qualityCheck: data.qualityCheck,
            extras: data.drink ?? null,
          }}
        />
      </div>
    );
  }
  if (isDimsumStyle(template, data.categorySlug)) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-3 py-4 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        {(topSlot || headerAction) && (
          <div className="mx-auto mb-3 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
            <div>{topSlot}</div>
            {headerAction}
          </div>
        )}
        <DimsumSopView
          editable={editable}
          data={{
            title: data.title,
            description: data.description,
            brandName: data.brandName,
            heroUrl,
            dishCode: data.dishCode,
            author: data.author,
            approvedBy: data.approvedBy,
            ingredients: data.ingredients,
            steps: data.steps,
            qualityCheck: data.qualityCheck,
            miseEnPlace: data.miseEnPlace,
            equipment: data.equipment,
            holding: data.holding,
            plating: data.plating,
            extras: data.dimsum ?? null,
          }}
        />
      </div>
    );
  }
  if (template === "aiko") {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-3 py-4 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        {(topSlot || headerAction) && (
          <div className="mx-auto mb-3 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
            <div>{topSlot}</div>
            {headerAction}
          </div>
        )}
        <AikoSopView data={toAikoCardData(data, heroUrl)} editable={editable} />
      </div>
    );
  }
  if (isDessertStyle(template, data.categorySlug)) {
    return <DessertSopView data={data} hero={hero} topSlot={topSlot} headerAction={headerAction} editable={editable} />;
  }
  return <RecipeSopView data={data} hero={hero} topSlot={topSlot} headerAction={headerAction} editable={editable} />;
}
