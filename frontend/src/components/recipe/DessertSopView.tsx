import type { ReactNode } from "react";
import { FitToWidth } from "./FitToWidth";
import type { SopViewData } from "./RecipeSopView";

/**
 * The Desserts / Drinks card: details on the left, the photo and a dark
 * Quality Check panel on the right (see lib/sop/dessert.ts). Same data and
 * editor hooks (`data-field`) as the standard SOP card.
 */
const CARD_WIDTH = 794;

const GREEN = "#173B2B";
const ORANGE = "#D95F1E";

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const TagIcon = () => <svg {...svgProps}><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>;
const PotIcon = () => <svg {...svgProps}><path d="M5 9h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" /><path d="M3 9h18M9 6h6M12 4v2M2.5 12H5M19 12h2.5" /></svg>;
const UserIcon = () => <svg {...svgProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>;
const LeafIcon = () => <svg {...svgProps}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>;
const SproutIcon = () => <svg {...svgProps}><path d="M12 21v-9" /><path d="M12 12C12 8 9 5.5 4.5 5.5 4.5 10 7 12 12 12z" /><path d="M12 14c0-3.5 2.5-6 7.5-6 0 4.5-2.5 6-7.5 6z" /></svg>;
const SnowIcon = () => <svg {...svgProps}><path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" /></svg>;
const ClockIcon = () => <svg {...svgProps}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9.5 2.5h5" /></svg>;
const CupIcon = () => <svg {...svgProps}><path d="M6 3h12l-1.2 17a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6 3z" /><path d="M6.4 8H12M6.8 13H12M7.2 17.5H12" /></svg>;
const IceIcon = () => <svg {...svgProps}><path d="M12 3l5 2.5v5L12 13 7 10.5v-5L12 3zM7 10.5l-4 2v5l5 2.5 4-2M17 10.5l4 2v5l-5 2.5-4-2M7 5.5l5 2.5 5-2.5M12 8v5" /></svg>;
const HatIcon = () => <svg {...svgProps}><path d="M7 13a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16 5.4 4 4 0 1 1 17 13v6H7v-6z" /><path d="M7 16h10" /></svg>;
const CheckCircle = ({ className }: { className?: string }) => <svg {...svgProps} className={className}><circle cx="12" cy="12" r="9.5" /><path d="M7.8 12.4l2.9 2.9 5.5-5.8" /></svg>;
const ClocheIcon = () => <svg {...svgProps}><path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10.5 6h3" /></svg>;
const STAT_ICONS = { tag: TagIcon, pot: PotIcon, user: UserIcon, leaf: LeafIcon, snow: SnowIcon, clock: ClockIcon, cup: CupIcon, ice: IceIcon } as const;

function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title, ""];
  return [words[0], words.slice(1).join(" ")];
}

const heading = "mb-1.5 font-[family-name:var(--font-playfair)] text-[12.5px] font-semibold uppercase tracking-[0]";
const dotted = "border-[#D95F1E]/60";

function Stat({ icon, label, value, field, first }: { icon: ReactNode; label: string; value: string; field?: string; first?: boolean }) {
  return (
    <div data-field={field} className={`flex flex-1 flex-col items-center px-1 text-center ${first ? "" : `border-l border-dotted ${dotted}`}`}>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#173B2B] p-[8px] text-[#173B2B]">{icon}</span>
      <b className="mt-2 text-[8.5px] font-bold uppercase tracking-[.04em] text-[#173B2B]">{label}</b>
      <span className="mt-1.5 whitespace-pre-line text-[10px] leading-[1.35] text-[#173B2B]">{value}</span>
    </div>
  );
}

/** "Iced tea (Tata Gold) – to 300 ml total" → name + a note line below it. */
function splitNote(name: string): [string, string | null] {
  const i = name.indexOf(" – ");
  return i < 0 ? [name, null] : [name.slice(0, i), name.slice(i + 3)];
}

export function DessertSopView({
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
  const [first, rest] = splitTitle(data.title || "Untitled recipe");
  const x = data.dessert;
  const upper = (s: string | null | undefined) => (s || "N/A").toUpperCase();
  const mins = (m: number | null, text?: string) => (text ?? `${m || 0} min`).toUpperCase();
  const garnish = data.garnish ?? [];
  const eyebrow = x?.eyebrow || (data.categoryName || "Dessert").replace(/s$/i, "");
  const hasSide = data.qualityCheck.length > 0 || !!data.notes || !!x?.serveTitle || !!x?.serveText || !!x?.assembly || editable;
  const PanelIcon = x?.panelIcon === "leaf" ? SproutIcon : () => <CheckCircle />;

  const rule = `border-t border-dotted ${dotted}`;
  const bullets = "space-y-[3px] text-[11px] leading-[1.45] text-[#2C3E35] [&>li]:relative [&>li]:pl-[13px] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.55em] [&>li]:before:h-[4px] [&>li]:before:w-[4px] [&>li]:before:rounded-full [&>li]:before:bg-[#D95F1E] [&>li]:before:content-['']";

  return (
    <div className="mx-auto w-full max-w-[1000px] px-3 py-4 sm:px-6 sm:py-8 print:max-w-none print:p-0 print:flex-1">
      {(topSlot || headerAction) && (
        <div className="mx-auto mb-3 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
          <div>{topSlot}</div>
          {headerAction}
        </div>
      )}

      <FitToWidth width={CARD_WIDTH}>
        <div className="grid min-h-[1123px] grid-cols-2 bg-[#F7F2EB] text-[#2C3E35] shadow-[0_6px_24px_rgba(0,0,0,.12)] print:shadow-none">
          {/* ---------- left column ---------- */}
          <div className="flex min-w-0 flex-col px-[28px] pb-[22px] pt-[26px]">
            <div className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: ORANGE }}>
              <span {...f("categoryId")}>{eyebrow}</span>
            </div>
            <div className="mb-3 mt-1.5 flex items-center gap-2">
              <span className="h-px flex-1" style={{ background: ORANGE }} />
              <span style={{ color: ORANGE }} className="text-[15px] leading-none">❖</span>
            </div>

            <h1 {...f("title")} className="break-words font-[family-name:var(--font-playfair)] text-[44px] font-medium uppercase leading-[1.02]">
              <span className="block" style={{ color: GREEN }}>{first}</span>
              {rest && <span className="block" style={{ color: ORANGE }}>{rest}</span>}
            </h1>

            {data.subtitle && <p {...f("subtitle")} className="mt-2 text-[12px] text-[#777]">{data.subtitle}</p>}

            {(data.description || editable) && (
              <p {...f("description")} className={`mt-4 whitespace-pre-wrap text-[12.5px] leading-[1.55] text-[#3d3d3d] ${data.description ? "" : "italic opacity-40"}`}>
                {data.description || "Add a description…"}
              </p>
            )}
            {data.summary && (
              <p {...f("summary")} className="mt-2 font-[family-name:var(--font-playfair)] text-[12px] italic leading-normal" style={{ color: GREEN }}>
                &ldquo;{data.summary}&rdquo;
              </p>
            )}

            {/* info box */}
            <div className="mt-4 rounded-[12px] px-[16px] py-[13px] text-[11.5px] text-white" style={{ background: GREEN }}>
              <div className="grid grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-1.5 pr-3">
                  {(data.dishCode || !x?.hideEmpty) && <div {...f("dishCode")}><b>Dish Code:</b> <span style={{ color: x?.glassware ? "#E8A35E" : undefined }}>{data.dishCode || "N/A"}</span></div>}
                  <div {...f("sopVersion")}><b>Version:</b> v{data.versionLabel}</div>
                </div>
                <div className={`space-y-1.5 border-l border-dotted pl-3 ${dotted}`}>
                  {(data.station || !x?.hideEmpty) && <div {...f("station")}><b>Station:</b> {data.station || "N/A"}</div>}
                  {x?.glassware && <div><b>Glassware:</b> {x.glassware}</div>}
                  {x?.garnishInfo && <div><b>Garnish:</b> {x.garnishInfo}</div>}
                  {(data.author || !x?.glassware) && <div {...f("author")}><b>Author:</b> {data.author || data.brandName}</div>}
                </div>
              </div>
              <div className={`mt-2.5 border-t border-dotted pt-2.5 ${dotted}`}>
                {x?.effectiveInBox ? (
                  <div className="grid grid-cols-[1.25fr_1fr]">
                    <div {...f("approvedBy")}><b>Approved by:</b> {data.approvedBy || "N/A"}</div>
                    <div {...f("effectiveDate")} className={`border-l border-dotted pl-3 text-[10px] ${dotted}`}>Effective: {fmtDate(data.effectiveDate)}</div>
                  </div>
                ) : (
                  <div {...f("approvedBy")}><b>Approved by:</b> {data.approvedBy || "N/A"}</div>
                )}
              </div>
            </div>

            {/* stats */}
            <div className="mt-4 flex items-start">
              {x?.stats ? (
                x.stats.map((s, i) => {
                  const Icon = STAT_ICONS[s.icon];
                  return <Stat key={i} first={i === 0} icon={<Icon />} label={s.label} value={s.value} />;
                })
              ) : (
                <>
                  <Stat first field="prepMinutes" icon={<TagIcon />} label="Prep time" value={mins(data.prepMinutes, data.timeText?.prep)} />
                  <Stat field="cookMinutes" icon={<PotIcon />} label="Cook time" value={mins(data.cookMinutes, data.timeText?.cook)} />
                  <Stat field="yieldText" icon={<UserIcon />} label="Yield" value={upper(data.yieldText)} />
                  {x?.chillTime && <Stat icon={<ClockIcon />} label="Chill time" value={x.chillTime.toUpperCase()} />}
                  <Stat field="dietary" icon={<LeafIcon />} label="Diet" value={upper(data.diet)} />
                  {x?.storeAt && <Stat icon={<SnowIcon />} label="Store at" value={x.storeAt} />}
                </>
              )}
            </div>

            <div className="my-4 flex items-center gap-2">
              <span className="h-px flex-1" style={{ background: ORANGE }} />
              <span style={{ color: ORANGE }} className="text-[14px] leading-none">❖</span>
              <span className="h-px flex-1" style={{ background: ORANGE }} />
            </div>

            {/* details */}
            <div className="grid flex-1 grid-cols-2 gap-[16px]">
              <div className={`min-w-0 border-r border-dotted pr-[12px] ${dotted}`}>
                <h3 {...f("ingredients")} className={heading} style={{ color: GREEN }}>Ingredients (NET)</h3>
                <div className="text-[11px] leading-[1.4]">
                  {data.ingredients.map((ing, i) => {
                    const [name, note] = splitNote(ing.name);
                    return (
                      <div key={i}>
                        {ing.groupLabel && ing.groupLabel !== data.ingredients[i - 1]?.groupLabel && (
                          <p className="mb-0.5 mt-2 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: ORANGE }}>{ing.groupLabel}</p>
                        )}
                        <div {...f(`ingredients.${i}`)} className="py-[2px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="relative min-w-0 flex-1 pl-[13px] before:absolute before:left-0 before:top-[0.5em] before:h-[4px] before:w-[4px] before:rounded-full before:bg-[#D95F1E] before:content-['']">{name}</span>
                            <span className="whitespace-nowrap text-right">{ing.quantity ? Number(ing.quantity) : ""} {ing.unit}</span>
                          </div>
                          {note && <div className="pl-[13px] pt-0.5 text-[10.5px]">{note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(data.miseEnPlace.length > 0 || editable) && (
                  <>
                    <div className={`${rule} my-3`} />
                    <h3 {...f("miseEnPlace")} className={heading} style={{ color: GREEN }}>Mise en place</h3>
                    <ul className={bullets}>
                      {data.miseEnPlace.length > 0
                        ? data.miseEnPlace.map((m, i) => <li key={i} {...f(`miseEnPlace.${i}`)}>{m}</li>)
                        : <li>None</li>}
                    </ul>
                  </>
                )}
                {(data.equipment.length > 0 || editable) && (
                  <>
                    <div className={`${rule} my-3`} />
                    <h3 {...f("equipment")} className={heading} style={{ color: GREEN }}>Equipment / Tools</h3>
                    <ul className={bullets}>
                      {data.equipment.length > 0
                        ? data.equipment.map((e, i) => <li key={i} {...f(`equipment.${i}`)}>{e}</li>)
                        : <li>None</li>}
                    </ul>
                  </>
                )}
                {x?.chefTip && (
                  <div className="mt-5 flex items-start gap-2 rounded-[8px] border px-[10px] py-[10px]" style={{ borderColor: `${ORANGE}99` }}>
                    <span className="h-[24px] w-[24px] shrink-0" style={{ color: ORANGE }}><HatIcon /></span>
                    <div>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[12.5px] font-semibold uppercase tracking-[.03em]" style={{ color: GREEN }}>Chef&apos;s Tip</h3>
                      <p className="mt-1 text-[10px] leading-[1.4]">{x.chefTip}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 {...f("steps")} className={heading} style={{ color: GREEN }}>{x?.methodTitle || "Method"}</h3>
                <ol className="text-[11px] leading-[1.38]">
                  {data.steps.map(({ body }, idx) => {
                    // Time-stamped steps ("Build (0:10–0:25): Add …") put the stamp on its own line.
                    const m = body.match(/^(.{2,40}?\([0-9:–\- ]+\)):\s+([\s\S]*)$/);
                    return (
                      <li key={idx} {...f(`steps.${idx}`)} className="mb-[8px] flex items-start gap-2">
                        <span className="mt-px inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white print:!bg-[#D95F1E]" style={{ background: ORANGE }}>{idx + 1}</span>
                        {m ? <span>{m[1]}:<br />{m[2]}</span> : <span>{body}</span>}
                      </li>
                    );
                  })}
                </ol>

                {garnish.length > 0 && (
                  <>
                    <h3 className={`${heading} mt-4`} style={{ color: GREEN }}>Garnish</h3>
                    <ul className={bullets}>{garnish.map((g, i) => <li key={i}>{g}</li>)}</ul>
                  </>
                )}

                {x?.ccp && (
                  <>
                    <div className={`${rule} mb-2.5 mt-2.5 w-[40%]`} />
                    <h3 className={heading} style={{ color: GREEN }}>CCP / Quality</h3>
                    <p className="whitespace-pre-line text-[11px] leading-[1.4]">{x.ccp}</p>
                  </>
                )}

                {(data.plating || !x?.hideEmpty) && (
                <>
                <div className={`${rule} mb-2.5 mt-2.5 w-[40%]`} />
                <h3 {...f("plating")} className={heading} style={{ color: GREEN }}>{x?.platingTitle || "Plating & Portioning"}</h3>
                <p className="whitespace-pre-line text-[11px] leading-[1.4]">{data.plating || "N/A"}</p>
                </>
                )}
                {(data.holding || (!x?.platingTitle && !x?.hideEmpty)) && (
                  <>
                    <div className={`${rule} my-2.5 w-[40%]`} />
                    <h3 {...f("holding")} className={heading} style={{ color: GREEN }}>Holding &amp; Shelf Life</h3>
                    <p className="whitespace-pre-line text-[11px] leading-[1.4]">{data.holding || "N/A"}</p>
                  </>
                )}
                {(data.allergens || (!x?.platingTitle && !x?.hideEmpty)) && (
                  <>
                    <div className={`${rule} my-2.5 w-[40%]`} />
                    <h3 {...f("allergens")} className={heading} style={{ color: GREEN }}>Allergens</h3>
                    <p className="whitespace-pre-line text-[11px] leading-[1.4]">{data.allergens || "N/A"}</p>
                  </>
                )}
                {x?.prepNote && (
                  <>
                    <div className={`${rule} my-2.5 w-[40%]`} />
                    <h3 className={heading} style={{ color: GREEN }}>Notes</h3>
                    <p className="whitespace-pre-line text-[11px] leading-[1.4]">{x.prepNote}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---------- right column ---------- */}
          <div className="flex min-w-0 flex-col">
            <div {...f("heroImageId")} className="relative h-[700px] w-full shrink-0 overflow-hidden bg-[#1a1a1a]">
              {hero}
            </div>
            {x?.photoCaption && (
              <div className="shrink-0 bg-[#2A2220] px-[18px] py-[7px] text-[9.5px] font-bold uppercase tracking-[.05em] text-white">{x.photoCaption}</div>
            )}
            {hasSide && (
              <div className="flex flex-1 flex-col px-[24px] py-[22px] text-center text-white print:!bg-[#173B2B]" style={{ background: GREEN }}>
                <div className="flex flex-1 flex-col justify-around border px-[22px] py-[18px]" style={{ borderColor: `${ORANGE}99` }}>
                  {(data.notes || editable) && (
                    <div>
                      <span className="mx-auto block h-[28px] w-[28px]" style={{ color: ORANGE }}><HatIcon /></span>
                      <h3 {...f("notes")} className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-medium uppercase tracking-[.03em]">{x?.notesTitle || "Chef's Notes"}</h3>
                      <p className={`mt-2 whitespace-pre-line text-[12px] leading-[1.55] text-white/90 ${data.notes ? "" : "italic opacity-50"}`}>{data.notes || "Add chef's notes…"}</p>
                    </div>
                  )}

                  {(data.qualityCheck.length > 0 || editable) && (
                    <div>
                      {data.notes && <div className="mb-4 border-t border-dotted" style={{ borderColor: ORANGE }} />}
                      <span className="mx-auto block h-[28px] w-[28px]" style={{ color: ORANGE }}><PanelIcon /></span>
                      <h3 {...f("qualityCheck")} className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-medium uppercase tracking-[.03em]">Quality Check Points</h3>
                      <ul className="mx-auto mt-3 inline-block space-y-[9px] text-left text-[12px]">
                        {data.qualityCheck.length > 0
                          ? data.qualityCheck.map((q, i) => (
                              <li key={i} {...f(`qualityCheck.${i}`)} className="flex items-start gap-2.5">
                                <CheckCircle className="mt-px h-[16px] w-[16px] shrink-0 text-[#D95F1E]" />
                                <span>{q}</span>
                              </li>
                            ))
                          : <li className="text-white/50">None</li>}
                      </ul>
                    </div>
                  )}

                  {x?.serviceStandard && (
                    <div className="text-left">
                      <div className="mb-3 border-t border-dotted" style={{ borderColor: ORANGE }} />
                      <h3 className="font-[family-name:var(--font-playfair)] text-[12px] font-semibold uppercase tracking-[.05em]" style={{ color: ORANGE }}>Service Standard</h3>
                      <dl className="mt-2 space-y-1 text-[11.5px]">
                        {x.serviceStandard.map((r, i) => (
                          <div key={i} className="grid grid-cols-[70px_1fr] gap-2"><dt className="font-bold uppercase" style={{ color: "#E8A35E" }}>{r.label}:</dt><dd>{r.value}</dd></div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {x?.assembly && (
                    <div>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[16px] font-semibold uppercase tracking-[.03em]">Final Assembly</h3>
                      <div className="mt-3 border-t border-dotted" style={{ borderColor: ORANGE }} />
                      <ol className="mt-3 space-y-2 text-left text-[12px]">
                        {x.assembly.map((a, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-px inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white print:!bg-[#D95F1E]" style={{ background: ORANGE }}>{i + 1}</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ol>
                      {x.assemblyGarnish && (
                        <>
                          <div className="mb-3 mt-5 border-t border-dotted" style={{ borderColor: ORANGE }} />
                          <h3 className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold uppercase tracking-[.03em]">Garnish</h3>
                          <p className="mt-1 text-[11.5px] font-semibold text-white/95">{x.assemblyGarnish}</p>
                        </>
                      )}
                    </div>
                  )}

                  {(x?.serveTitle || x?.serveText) && (
                    <div>
                      <div className="mb-4 border-t border-dotted" style={{ borderColor: ORANGE }} />
                      <span className="mx-auto block h-[28px] w-[28px]" style={{ color: ORANGE }}><ClocheIcon /></span>
                      {x.serveTitle && <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-medium uppercase tracking-[.03em]">{x.serveTitle}</h3>}
                      {x.serveText && <p className="mt-1 text-[12px] text-white/90">{x.serveText}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </FitToWidth>
    </div>
  );
}

function fmtDate(d: Date | null | undefined) {
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d) : "N/A";
}
