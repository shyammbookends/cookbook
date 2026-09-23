import type { ReactNode } from "react";

/**
 * The Recipe/SOP document body. Rendered by the public recipe page and by the
 * admin editor's live preview, so the preview can never drift from production.
 *
 * With `editable`, every piece of content carries a `data-field` attribute
 * naming the editor field it comes from (form paths like "ingredients.3").
 */
export interface SopViewData {
  title: string;
  description: string | null;
  summary: string | null;
  categoryName: string | null;
  station: string | null;
  brandName: string;
  dishCode: string | null;
  versionLabel: string; // "2.1" — already resolved from sopVersion / version
  author: string | null;
  approvedBy: string | null;
  effectiveDate: Date | null;
  nextReviewDate: Date | null;
  yieldText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  diet: string | null;
  miseEnPlace: string[];
  equipment: string[];
  qualityCheck: string[];
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
  steps: string[];
  plating: string | null;
  holding: string | null;
  allergens: string | null;
}

export function sopVersionLabel(sopVersion: string | null | undefined, version: number | null | undefined): string {
  const v = sopVersion?.trim().replace(/^v/i, "");
  return v || `${version ?? 1}.0`;
}

const ScaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M12 3v18M12 3l-8 5v2a8 8 0 0 0 16 0V8l-8-5z" />
    <path d="M12 11h.01" />
  </svg>
);
const KnifeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M11.63 12.87L2 22.5" />
    <path d="M22.5 2L11.13 13.37A2.83 2.83 0 0 1 7.13 9.37L18.5 2h4v4z" />
  </svg>
);
const PotIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M5 8h14M3 8c0 5 3 11 9 11s9-6 9-11M8 3v3M16 3v3M12 2v4" />
  </svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
const BowlIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 12h20M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8" />
    <path d="M12 6v2M8 5v3M16 5v3" />
  </svg>
);
const CoverIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 16h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 4V2" />
  </svg>
);
const WheatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 22l10-10M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5M12 12c0 2.76 2.24 5 5 5s5-2.24 5-5" />
    <path d="M7 7c2.76 0 5-2.24 5-5" />
    <path d="M17 17c0-2.76-2.24-5-5-5" />
  </svg>
);
const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const CheckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-4 h-4"}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const formatSopDate = (d: Date | null | undefined) =>
  d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d) : "N/A";

export function RecipeSopView({
  data,
  hero,
  topSlot,
  headerAction,
  editable = false,
}: {
  data: SopViewData;
  hero: ReactNode;
  topSlot?: ReactNode;
  headerAction?: ReactNode;
  editable?: boolean;
}) {
  const f = (field: string) => (editable ? { "data-field": field } : {});
  // In the editor, empty optional fields still get a faint, clickable stand-in.
  const ghost = "opacity-40 italic";
  const docId = `${data.dishCode || "N/A"}-v${data.versionLabel}`;
  const metaRow = "grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b";

  return (
    <>
      <div className="mx-auto max-w-[1000px] p-8 md:p-12 bg-[#FAF8F5] print:p-8 print:max-w-none print:flex-1 w-full">
        {topSlot}

        {/* Header */}
        <div className="mb-6 print:mb-4 border-b-2 border-[#D4B572] pb-4 print:pb-2 flex justify-between items-end relative">
          <div className="pr-16">
            <div className="text-sm print:text-xs font-bold tracking-widest text-[#D4B572] uppercase">
              <span {...f("categoryId")}>{data.categoryName || "RECIPE"}</span>
              {(data.station || editable) && (
                <>
                  {" | "}
                  <span {...f("station")} className={data.station ? undefined : ghost}>{data.station || "Station"}</span>
                </>
              )}
            </div>
            <h1 {...f("title")} className="mt-4 print:mt-1 text-5xl md:text-7xl print:text-5xl font-[family-name:var(--font-playfair)] text-[#1F3D2D]">
              {data.title || "Untitled recipe"}
            </h1>
            {(data.description || editable) && (
              <p {...f("description")} className={`mt-4 print:mt-2 max-w-2xl text-[15px] print:text-xs leading-relaxed text-[#2C3E35]/80 whitespace-pre-wrap ${data.description ? "" : ghost}`}>
                {data.description || "Add a description…"}
              </p>
            )}
          </div>
          {headerAction && <div className="print:hidden absolute right-0 bottom-4">{headerAction}</div>}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] print:grid-cols-[1fr_1.8fr] gap-12 print:gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8 print:gap-5">
            {/* Meta Table */}
            <div className="text-[13px] print:text-[11px]">
              <div {...f("dishCode")} className={`${metaRow} border-[#E6E1DA]`}><span className="font-bold">DISH CODE:</span> <span>{data.dishCode || "N/A"}</span></div>
              <div {...f("sopVersion")} className={`${metaRow} border-[#E6E1DA]`}><span className="font-bold">VERSION:</span> <span>v{data.versionLabel}</span></div>
              <div {...f("author")} className={`${metaRow} border-[#E6E1DA]`}><span className="font-bold">AUTHOR:</span> <span>{data.author || data.brandName}</span></div>
              <div {...f("approvedBy")} className={`${metaRow} border-[#E6E1DA]`}><span className="font-bold">APPROVED BY:</span> <span>{data.approvedBy || "N/A"}</span></div>
              <div {...f("effectiveDate")} className={`${metaRow} border-[#E6E1DA]`}><span className="font-bold">EFFECTIVE:</span> <span>{formatSopDate(data.effectiveDate)}</span></div>
              <div {...f("nextReviewDate")} className={`${metaRow} border-[#D4B572]`}><span className="font-bold">NEXT REVIEW:</span> <span>{formatSopDate(data.nextReviewDate)}</span></div>
            </div>

            {/* Icons Grid */}
            <div className="grid grid-cols-6 gap-y-8 print:gap-y-4 gap-x-2 text-center text-xs font-bold border-b border-[#D4B572] pb-8 print:pb-4 text-[#1F3D2D]">
              <div {...f("yieldText")} className="col-span-2 flex flex-col items-center gap-2 print:gap-1">
                <ScaleIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">YIELD</span>
                <span className="font-normal text-sm print:text-xs leading-tight text-gray-700 whitespace-pre-wrap">{data.yieldText?.replace(" ", "\n") || "N/A"}</span>
              </div>
              <div {...f("prepMinutes")} className="col-span-2 flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <KnifeIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">PREP</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{data.prepMinutes || 0} min</span>
              </div>
              <div {...f("cookMinutes")} className="col-span-2 flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <PotIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">COOK</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{data.cookMinutes || 0} min</span>
              </div>
              <div {...f("totalMinutes")} className="col-span-2 col-start-2 flex flex-col items-center gap-2 print:gap-1">
                <ClockIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">TOTAL</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">~{data.totalMinutes || 0} min</span>
              </div>
              <div {...f("dietary")} className="col-span-2 flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <LeafIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">DIET</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{data.diet || "N/A"}</span>
              </div>
            </div>

            {/* Mise en Place */}
            <div className="border-b border-[#D4B572] pb-6 print:pb-3">
              <h3 {...f("miseEnPlace")} className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Mise En Place</h3>
              <ul className="list-disc pl-5 space-y-1.5 print:space-y-0.5 text-sm print:text-xs">
                {data.miseEnPlace.length > 0
                  ? data.miseEnPlace.map((m, i) => <li key={i} {...f(`miseEnPlace.${i}`)}>{m}</li>)
                  : <li {...f("miseEnPlace")}>None</li>}
              </ul>
            </div>

            {/* Equipment */}
            <div className="border-b border-[#D4B572] pb-6 print:pb-3">
              <h3 {...f("equipment")} className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Equipment / Tools</h3>
              <ul className="list-disc pl-5 space-y-1.5 print:space-y-0.5 text-sm print:text-xs">
                {data.equipment.length > 0
                  ? data.equipment.map((e, i) => <li key={i} {...f(`equipment.${i}`)}>{e}</li>)
                  : <li {...f("equipment")}>None</li>}
              </ul>
            </div>

            {/* Ingredients */}
            <div className="pb-6 print:pb-0">
              <h3 {...f("ingredients")} className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Ingredients (NET)</h3>
              <div className="space-y-1.5 print:space-y-0.5 text-sm print:text-[11px] flex flex-col">
                {data.ingredients.map((ing, i) => (
                  <div key={i} {...f(`ingredients.${i}`)} className="flex justify-between w-full relative overflow-hidden">
                    <span className="bg-[#FAF8F5] pr-2 z-10">{ing.name}</span>
                    <div className="absolute inset-0 border-b-2 border-dotted border-[#C0C0C0] top-[60%] -z-0"></div>
                    <span className="bg-[#FAF8F5] pl-2 z-10 whitespace-nowrap">{ing.quantity ? Number(ing.quantity) : ""} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 print:gap-4">
            <div {...f("heroImageId")} className="w-full aspect-[4/3] rounded-2xl print:rounded-xl overflow-hidden relative shadow-md">
              {hero}
            </div>

            {(data.summary || editable) && (
              <p {...f("summary")} className={`-mt-2 print:mt-0 text-center text-lg print:text-sm italic leading-relaxed text-[#1F3D2D] font-[family-name:var(--font-playfair)] ${data.summary ? "" : "opacity-40"}`}>
                {data.summary ? <>&ldquo;{data.summary}&rdquo;</> : "Add a summary…"}
              </p>
            )}

            {/* Green Box */}
            <div className="bg-[#1F3D2D] rounded-3xl print:rounded-xl p-8 print:p-5 text-white flex flex-col gap-8 print:gap-4 print:!bg-[#1F3D2D]">
              <div {...f("plating")} className="flex gap-5 print:gap-3">
                <BowlIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Plating & Service</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{data.plating || "N/A"}</p>
                </div>
              </div>

              <div className="w-full h-[2px] bg-[#D4B572] opacity-30"></div>

              <div {...f("holding")} className="flex gap-5 print:gap-3">
                <CoverIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Holding & Shelf Life</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{data.holding || "N/A"}</p>
                </div>
              </div>

              <div className="w-full h-[2px] bg-[#D4B572] opacity-30"></div>

              <div {...f("allergens")} className="flex gap-5 print:gap-3">
                <WheatIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Allergens</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{data.allergens || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Method */}
            <div className="mt-4 print:mt-1">
              <h3 {...f("steps")} className="font-bold uppercase tracking-widest border-b border-[#D4B572] pb-3 print:pb-1 mb-6 print:mb-3 print:text-[11px]">Method</h3>
              <div className="space-y-6 print:space-y-3">
                {data.steps.map((body, idx) => (
                  <div key={idx} {...f(`steps.${idx}`)} className="flex gap-5 print:gap-3 items-start">
                    <div className="w-7 h-7 print:w-5 print:h-5 print:text-[10px] rounded-full bg-[#1F3D2D] text-white flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-[15px] print:text-xs leading-relaxed pt-1 print:pt-0">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Check */}
            {(data.qualityCheck.length > 0 || editable) && (
              <div className="print:mt-1">
                <h3 {...f("qualityCheck")} className="font-bold uppercase tracking-widest border-b border-[#D4B572] pb-3 print:pb-1 mb-4 print:mb-2 print:text-[11px]">Quality Check</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 print:gap-y-1 text-sm print:text-xs">
                  {data.qualityCheck.length > 0
                    ? data.qualityCheck.map((q, i) => (
                        <li key={i} {...f(`qualityCheck.${i}`)} className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#D4B572]" />
                          <span>{q}</span>
                        </li>
                      ))
                    : <li {...f("qualityCheck")} className="text-[#2C3E35]/50">None</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 print:mt-auto bg-[#1F3D2D] text-white py-4 print:py-2 px-8 print:px-5 rounded-lg flex flex-wrap justify-between items-center text-xs print:text-[10px] font-medium gap-4 print:gap-2 print:!bg-[#1F3D2D]">
        <div {...f("dishCode")} className="flex gap-2 items-center">
          <ClipboardIcon className="text-[#D4B572] w-5 h-5 print:w-4 print:h-4" />
          <span>Document ID: {docId}</span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 print:gap-4">
          <span {...f("effectiveDate")}>Effective: {formatSopDate(data.effectiveDate)}</span>
          <span {...f("nextReviewDate")}>Next review: {formatSopDate(data.nextReviewDate)}</span>
          <span>Page 1 of 1</span>
        </div>
        <div {...f("brandId")} className="text-[#D4B572] font-bold text-sm print:text-[11px] tracking-wide">{data.brandName} Hospitality</div>
      </div>
    </>
  );
}
