"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useForm, useFieldArray, useController, useWatch, type Control, type Resolver, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RecipeInputSchema, type RecipeInput, type RecipeFormValues } from "@/lib/schemas/recipe";
import { createRecipeAction, updateRecipeAction } from "@/app/admin/actions/recipe";
import { uploadMediaAction } from "@/app/admin/actions/media";
import { RecipeSopView, sopVersionLabel, type SopViewData } from "@/components/recipe/RecipeSopView";

export interface FormBrand {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export interface RecipeFormInitial extends Partial<RecipeFormValues> {
  id?: string;
  version?: number;
  heroImagePreview?: string | null;
}

/**
 * Only the fields shown on the Recipe/SOP page are editable here. Everything
 * else on the record (slug, SEO, tags, gallery, custom fields…) is carried
 * through untouched from `initial`, so saving never drops data.
 */
const EMPTY: RecipeFormValues = {
  brandId: "", categoryId: null, externalId: null, slug: undefined, title: "", subtitle: null, excerpt: null,
  description: null, heroImageId: null, prepMinutes: null, cookMinutes: null, restMinutes: null, totalMinutes: null,
  servings: null, yieldText: null, difficulty: null, cuisine: null, course: null, dietary: [], spiceLevel: null,
  equipment: [], nutrition: null, notes: null, tips: null, dishCode: null, author: null, approvedBy: null, effectiveDate: null,
  nextReviewDate: null, miseEnPlace: [], plating: null, holding: null, allergens: null, station: null, summary: null,
  sopVersion: null, qualityCheck: [], customFields: {}, tagIds: [], ingredients: [], steps: [],
  galleryMediaIds: [], status: "DRAFT", publishAt: null, featured: false, seoTitle: null, seoDescription: null, noindex: false,
};

const DIET_OPTIONS = ["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian", "Jain"];
const PHASE_ORDER = { PREP: 0, COOK: 1, FINISH: 2 } as const;
type Phase = keyof typeof PHASE_ORDER;

// ---------- value helpers ----------

function toNumberOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInputDate(v: unknown): string {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : "";
}

function totalOf(v: Pick<RecipeFormValues, "prepMinutes" | "cookMinutes" | "restMinutes">): number {
  return (toNumberOrNull(v.prepMinutes) ?? 0) + (toNumberOrNull(v.cookMinutes) ?? 0) + (toNumberOrNull(v.restMinutes) ?? 0);
}

/**
 * Shapes raw form state into what the schema/service expect: blank strings →
 * null, positions from list order, total time recomputed server-side, and each
 * step's phase kept but made non-decreasing so the SOP page (which orders
 * steps prep → cook → finish) shows them in exactly the editor's order.
 */
function normalize(v: RecipeFormValues): RecipeFormValues {
  const out: Record<string, unknown> = { ...v };
  for (const [k, val] of Object.entries(out)) {
    if (typeof val === "string" && val.trim() === "" && k !== "title" && k !== "brandId") out[k] = null;
  }
  if (out.slug === null) out.slug = undefined;
  out.totalMinutes = null;
  out.prepMinutes = toNumberOrNull(v.prepMinutes);
  out.cookMinutes = toNumberOrNull(v.cookMinutes);

  const clean = (list: string[] | undefined) => (list ?? []).map((s) => s.trim()).filter(Boolean);
  out.miseEnPlace = clean(v.miseEnPlace);
  out.equipment = clean(v.equipment);
  out.qualityCheck = clean(v.qualityCheck);
  out.dietary = clean(v.dietary);

  out.ingredients = (v.ingredients ?? []).map((i, position) => {
    const quantity = toNumberOrNull(i.quantity);
    const unit = i.unit?.trim() || null;
    const name = i.name ?? "";
    const raw = i.raw?.trim() || [quantity, unit, name.trim()].filter((x) => x != null && x !== "").join(" ");
    return { ...i, position, quantity, unit, name, raw };
  });

  let phase: Phase = "PREP";
  out.steps = (v.steps ?? []).map((s, position) => {
    const own = (s.phase ?? phase) as Phase;
    phase = PHASE_ORDER[own] < PHASE_ORDER[phase] ? phase : own;
    return { ...s, phase, position };
  });
  return out as RecipeFormValues;
}

const baseResolver = zodResolver(RecipeInputSchema);
const resolver: Resolver<RecipeFormValues, unknown, RecipeInput> = (values, ctx, opts) =>
  (baseResolver as unknown as Resolver<RecipeFormValues, unknown, RecipeInput>)(normalize(values), ctx, opts);

/** First error path in form order, e.g. "ingredients.2.name". */
function firstErrorPath(errors: FieldErrors, prefix = ""): string | null {
  for (const [key, val] of Object.entries(errors)) {
    if (!val) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && "message" in val && val.message) return path;
    if (typeof val === "object") {
      const nested = firstErrorPath(val as FieldErrors, path);
      if (nested) return nested;
    }
  }
  return null;
}

// ---------- styles ----------

const inputCls =
  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
/** Every jump target: gets a brief ring when reached from the preview. */
const targetCls = "rounded-md transition-shadow duration-300 data-[flash]:ring-2 data-[flash]:ring-amber-400 data-[flash]:ring-offset-2";
const iconBtn = "flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent";

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={`sec-${id}`} className="border-b border-slate-200 px-5 py-5 last:border-b-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ path, label, error, className, children }: { path: string; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div data-edit={path} className={`${targetCls} ${className ?? ""}`}>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function RowButtons({ index, count, onMove, onRemove, label }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${label} up`} title="Move up">↑</button>
      <button type="button" className={iconBtn} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${label} down`} title="Move down">↓</button>
      <button type="button" className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`} onClick={onRemove} aria-label={`Remove ${label}`} title="Remove">✕</button>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">
      + {children}
    </button>
  );
}

/** Repeatable list of plain strings (Mise en Place, Equipment, Quality Check). */
function StringListEditor({
  control, name, itemLabel, placeholder, focusPath,
}: {
  control: Control<RecipeFormValues, unknown, RecipeInput>;
  name: "miseEnPlace" | "equipment" | "qualityCheck";
  itemLabel: string;
  placeholder: string;
  focusPath: (path: string) => void;
}) {
  const { field } = useController({ control, name });
  const items: string[] = field.value ?? [];
  const set = (next: string[]) => field.onChange(next);
  const insertAfter = (i: number) => {
    set([...items.slice(0, i + 1), "", ...items.slice(i + 1)]);
    focusPath(`${name}.${i + 1}`);
  };
  const move = (from: number, to: number) => {
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    set(next);
  };

  return (
    <div data-edit={name} className={targetCls}>
      <ul className="space-y-1.5">
        {items.map((value, i) => (
          <li key={i} data-edit={`${name}.${i}`} className={`flex items-center gap-1.5 ${targetCls}`}>
            <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-slate-400">{i + 1}</span>
            <input
              value={value}
              placeholder={placeholder}
              onChange={(e) => set(items.map((v, j) => (j === i ? e.target.value : v)))}
              onKeyDown={(e) => {
                if (e.key === "Enter") insertAfter(i);
                if (e.key === "Backspace" && value === "" && items.length > 0) {
                  e.preventDefault();
                  set(items.filter((_, j) => j !== i));
                  if (i > 0) focusPath(`${name}.${i - 1}`);
                }
              }}
              className={inputCls}
            />
            <RowButtons index={i} count={items.length} label={itemLabel} onMove={move} onRemove={() => set(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <AddButton onClick={() => insertAfter(items.length - 1)}>Add {itemLabel}</AddButton>
    </div>
  );
}

/** Diet is stored as a string[]; edited as a comma-separated line with suggestions. */
function DietInput({ control }: { control: Control<RecipeFormValues, unknown, RecipeInput> }) {
  const { field } = useController({ control, name: "dietary" });
  const [text, setText] = useState(() => (field.value ?? []).join(", "));
  return (
    <>
      <input
        value={text}
        list="diet-options"
        placeholder="Vegetarian"
        onChange={(e) => {
          setText(e.target.value);
          field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        onBlur={field.onBlur}
        className={inputCls}
      />
      <datalist id="diet-options">
        {DIET_OPTIONS.map((d) => <option key={d} value={d} />)}
      </datalist>
    </>
  );
}

function DateInput({ control, name }: { control: Control<RecipeFormValues, unknown, RecipeInput>; name: "effectiveDate" | "nextReviewDate" }) {
  const { field } = useController({ control, name });
  return (
    <input
      type="date"
      value={toInputDate(field.value)}
      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
      onBlur={field.onBlur}
      className={inputCls}
    />
  );
}

// ---------- live preview ----------

function toViewData(v: RecipeFormValues, brands: FormBrand[], version: number | undefined): SopViewData {
  const brand = brands.find((b) => b.id === v.brandId);
  const str = (s: string | null | undefined) => (s && s.trim() ? s : null);
  return {
    title: v.title ?? "",
    description: str(v.description),
    summary: str(v.summary),
    categoryName: brand?.categories.find((c) => c.id === v.categoryId)?.name ?? null,
    station: str(v.station),
    brandName: brand?.name ?? "Brand",
    dishCode: str(v.dishCode),
    versionLabel: sopVersionLabel(v.sopVersion, version),
    author: str(v.author),
    approvedBy: str(v.approvedBy),
    effectiveDate: toDate(v.effectiveDate),
    nextReviewDate: toDate(v.nextReviewDate),
    yieldText: str(v.yieldText),
    prepMinutes: toNumberOrNull(v.prepMinutes),
    cookMinutes: toNumberOrNull(v.cookMinutes),
    totalMinutes: totalOf(v) || null,
    diet: (v.dietary ?? []).join(", ") || null,
    miseEnPlace: v.miseEnPlace ?? [],
    equipment: v.equipment ?? [],
    qualityCheck: v.qualityCheck ?? [],
    ingredients: (v.ingredients ?? []).map((i) => ({ name: i.name ?? "", quantity: toNumberOrNull(i.quantity), unit: i.unit ?? null })),
    steps: (v.steps ?? []).map((s) => s.body ?? ""),
    plating: str(v.plating),
    holding: str(v.holding),
    allergens: str(v.allergens),
  };
}

const DESIGN_WIDTH = 1000; // the SOP page's max width

function LivePreview({
  control, brands, version, heroPreview, onPick,
}: {
  control: Control<RecipeFormValues, unknown, RecipeInput>;
  brands: FormBrand[];
  version: number | undefined;
  heroPreview: string | null;
  onPick: (path: string) => void;
}) {
  const values = useWatch({ control }) as RecipeFormValues;
  const data = useMemo(() => toViewData(values, brands, version), [values, brands, version]);
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Render the page at its real desktop width and scale it to fit the pane,
  // so the preview matches production layout instead of a squeezed version.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setZoom(window.innerWidth >= 768 ? Math.min(1, w / DESIGN_WIDTH) : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="w-full">
      <div
        style={{ zoom, width: zoom < 1 ? DESIGN_WIDTH : undefined }}
        className="bg-[#FAF8F5] pb-6 font-sans text-[#2C3E35] [&_[data-field]]:cursor-pointer [&_[data-field]]:rounded-sm [&_[data-field]:hover]:outline-2 [&_[data-field]:hover]:outline-offset-2 [&_[data-field]:hover]:outline-amber-500/80 [&_[data-field]:hover]:outline-dashed"
        onClick={(e) => {
          const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-field]");
          if (hit?.dataset.field) {
            e.preventDefault();
            onPick(hit.dataset.field);
          }
        }}
      >
        <RecipeSopView
          editable
          data={data}
          hero={
            heroPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#E6E1DA] text-sm font-medium text-[#2C3E35]/50">Click to add a hero image</div>
            )
          }
        />
      </div>
    </div>
  );
}

// ---------- editor ----------

export function RecipeForm({ brands, initial }: { brands: FormBrand[]; initial?: RecipeFormInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(initial?.heroImagePreview ?? null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    control, register, handleSubmit, setValue, getValues,
    formState: { errors, isDirty },
  } = useForm<RecipeFormValues, unknown, RecipeInput>({
    resolver,
    defaultValues: { ...EMPTY, ...initial },
  });

  const ingredientArray = useFieldArray({ control, name: "ingredients" });
  const stepArray = useFieldArray({ control, name: "steps" });

  const brandId = useWatch({ control, name: "brandId" });
  const [prep, cook, rest] = useWatch({ control, name: ["prepMinutes", "cookMinutes", "restMinutes"] });
  const currentBrand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId]);

  /** Scroll the editor to a field path, focus its control and flash it. Falls back to the parent path. */
  const jumpTo = useCallback((path: string) => {
    const root = editorRef.current;
    if (!root) return;
    let el: HTMLElement | null = null;
    for (let p = path; p && !el; p = p.includes(".") ? p.slice(0, p.lastIndexOf(".")) : "") {
      el = root.querySelector<HTMLElement>(`[data-edit="${CSS.escape(p)}"]`);
    }
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    const focusable = el.matches("input,textarea,select,button")
      ? el
      : el.querySelector<HTMLElement>("input:not([type=file]):not([readonly]),textarea,select,button");
    focusable?.focus({ preventScroll: true });
    el.setAttribute("data-flash", "");
    window.setTimeout(() => el?.removeAttribute("data-flash"), 1400);
  }, []);

  /** Focus a field after React has rendered it (for rows added just now). */
  const focusPath = useCallback((path: string) => {
    requestAnimationFrame(() => requestAnimationFrame(() => jumpTo(path)));
  }, [jumpTo]);

  function pickFromPreview(path: string) {
    if (mobileTab === "preview") {
      setMobileTab("edit");
      focusPath(path);
    } else {
      jumpTo(path);
    }
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setFormError(null);
    const fd = new FormData();
    fd.set("file", file);
    if (brandId) fd.set("brandId", brandId);
    fd.set("alt", getValues("title") || "");
    const result = await uploadMediaAction(fd);
    setUploadingHero(false);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setValue("heroImageId", result.data.id, { shouldDirty: true });
    setHeroPreview(URL.createObjectURL(file));
  }

  function onSubmit(data: RecipeInput) {
    setFormError(null);
    // Status is managed by the Publish/Unpublish actions above the editor; keep whatever is current.
    const input = { ...data, status: initial?.status ?? data.status };
    startTransition(async () => {
      const result = initial?.id
        ? await updateRecipeAction(initial.id, input, initial.version)
        : await createRecipeAction(input);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setSavedAt(Date.now());
      if (initial?.id) router.refresh();
      else router.push(`/admin/recipes/${result.data.id}`);
    });
  }

  function onInvalid(errs: FieldErrors<RecipeFormValues>) {
    setFormError("Some fields need attention.");
    const path = firstErrorPath(errs as FieldErrors);
    if (path) {
      setMobileTab("edit");
      focusPath(path);
    }
  }

  useEffect(() => {
    if (!savedAt) return;
    const t = window.setTimeout(() => setSavedAt(null), 2500);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const submit = () => handleSubmit(onSubmit, onInvalid)();
  const ingErrors = errors.ingredients as unknown as { name?: { message?: string } }[] | undefined;
  const stepErrors = errors.steps as unknown as { body?: { message?: string } }[] | undefined;

  function addIngredient(at = ingredientArray.fields.length) {
    ingredientArray.insert(at, { position: at, name: "", quantity: null, unit: "", raw: "" }, { shouldFocus: false });
    focusPath(`ingredients.${at}`);
  }

  function addStep(at = stepArray.fields.length) {
    const prevPhase = (getValues(`steps.${at - 1}.phase`) as Phase | undefined) ?? "PREP";
    stepArray.insert(at, { phase: prevPhase, position: at, body: "" }, { shouldFocus: false });
    focusPath(`steps.${at}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          void submit();
          return;
        }
        // Enter inside a single-line input must never submit the whole recipe.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
      className="flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(380px,5fr)_7fr] lg:gap-5"
    >
      {/* Mobile / tablet: switch between editor and preview */}
      <div className="sticky top-0 z-20 -mx-4 flex gap-1 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${mobileTab === tab ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`}
          >
            {tab === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      {/* ---------------- Editor ---------------- */}
      <div className={`${mobileTab === "edit" ? "flex" : "hidden"} min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex`}>
        <div ref={editorRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Section id="basic" title="Basic information">
            <div className="grid grid-cols-2 gap-3">
              <Field path="title" label="Recipe name" error={errors.title?.message} className="col-span-2">
                <input {...register("title")} className={`${inputCls} text-base font-semibold`} placeholder="Persimmon Salad" />
              </Field>
              <Field path="brandId" label="Brand" error={errors.brandId?.message}>
                <select
                  {...register("brandId", { onChange: () => setValue("categoryId", null) })}
                  className={inputCls}
                >
                  <option value="">Select a brand…</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field path="categoryId" label="Category">
                <select {...register("categoryId", { setValueAs: (v) => v || null })} className={inputCls} disabled={!currentBrand}>
                  <option value="">None</option>
                  {currentBrand?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field path="station" label="Station" className="col-span-2 sm:col-span-1">
                <input {...register("station")} className={inputCls} placeholder="Cold Station" />
              </Field>
              <div data-edit="heroImageId" className={`col-span-2 sm:col-span-1 ${targetCls}`}>
                <label className={labelCls}>Hero image</label>
                <div className="flex items-center gap-2">
                  {heroPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroPreview} alt="" className="h-9 w-12 rounded object-cover ring-1 ring-slate-200" />
                  ) : (
                    <div className="h-9 w-12 rounded border border-dashed border-slate-300 bg-slate-50" />
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingHero} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    {uploadingHero ? "Uploading…" : heroPreview ? "Replace" : "Upload"}
                  </button>
                  {heroPreview && !uploadingHero && (
                    <button type="button" onClick={() => { setValue("heroImageId", null, { shouldDirty: true }); setHeroPreview(null); }} className="text-xs font-medium text-slate-400 hover:text-red-600">
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleHeroUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              <Field path="description" label="Description" className="col-span-2">
                <textarea {...register("description")} rows={3} className={inputCls} placeholder="Sweet persimmon, strawberry and creamy burrata on a bed of arugula…" />
              </Field>
            </div>
          </Section>

          <Section id="sop" title="SOP identification">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field path="dishCode" label="Dish code"><input {...register("dishCode")} className={inputCls} placeholder="SL-01" /></Field>
              <Field path="sopVersion" label="Version">
                <input {...register("sopVersion")} className={inputCls} placeholder={sopVersionLabel(null, initial?.version)} />
              </Field>
              <Field path="author" label="Author / source"><input {...register("author")} className={inputCls} placeholder="Bookends Culinary" /></Field>
              <Field path="approvedBy" label="Approved by"><input {...register("approvedBy")} className={inputCls} /></Field>
              <Field path="effectiveDate" label="Effective date"><DateInput control={control} name="effectiveDate" /></Field>
              <Field path="nextReviewDate" label="Next review"><DateInput control={control} name="nextReviewDate" /></Field>
            </div>
          </Section>

          <Section id="overview" title="Overview">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field path="yieldText" label="Yield"><input {...register("yieldText")} className={inputCls} placeholder="1 portion" /></Field>
              <Field path="prepMinutes" label="Prep (min)">
                <input type="number" min={0} inputMode="numeric" {...register("prepMinutes", { setValueAs: toNumberOrNull })} className={inputCls} />
              </Field>
              <Field path="cookMinutes" label="Cook (min)">
                <input type="number" min={0} inputMode="numeric" {...register("cookMinutes", { setValueAs: toNumberOrNull })} className={inputCls} />
              </Field>
              <Field path="totalMinutes" label="Total (auto)">
                <input readOnly tabIndex={-1} value={`~${totalOf({ prepMinutes: prep, cookMinutes: cook, restMinutes: rest })} min`} className={`${inputCls} bg-slate-50 text-slate-500`} />
              </Field>
              <Field path="dietary" label="Diet" className="col-span-2">
                <DietInput control={control} />
              </Field>
            </div>
            <Field path="summary" label="Summary" className="mt-3">
              <textarea {...register("summary")} rows={2} className={inputCls} placeholder="A refreshing balance of sweet, creamy and savoury…" />
            </Field>
          </Section>

          <Section id="service" title="Service">
            <div className="space-y-3">
              <Field path="plating" label="Plating & service">
                <textarea {...register("plating")} rows={3} className={inputCls} placeholder={"Chilled plate.\nAssemble to order."} />
              </Field>
              <Field path="holding" label="Holding & shelf life">
                <textarea {...register("holding")} rows={2} className={inputCls} placeholder="Serve immediately." />
              </Field>
              <Field path="allergens" label="Allergens">
                <textarea {...register("allergens")} rows={2} className={inputCls} placeholder={"Contains: Milk, Tree nuts.\nCross-contact: Gluten."} />
              </Field>
            </div>
          </Section>

          <Section id="ingredients" title="Ingredients" hint="Enter in Unit adds a row">
            <div data-edit="ingredients" className={targetCls}>
              <div className="mb-1 hidden grid-cols-[20px_1fr_72px_72px_84px] gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                <span /><span>Ingredient</span><span>Qty</span><span>Unit</span><span />
              </div>
              <ul className="space-y-1.5">
                {ingredientArray.fields.map((field, i) => (
                  <li key={field.id} data-edit={`ingredients.${i}`} className={targetCls}>
                    <div className="grid grid-cols-[20px_1fr_60px_60px] items-center gap-1.5 sm:grid-cols-[20px_1fr_72px_72px_84px]">
                      <span className="text-right text-[11px] tabular-nums text-slate-400">{i + 1}</span>
                      <input {...register(`ingredients.${i}.name` as const)} placeholder="Ingredient" className={inputCls} />
                      <input
                        {...register(`ingredients.${i}.quantity` as const, { setValueAs: toNumberOrNull })}
                        type="number" step="any" min={0} inputMode="decimal" placeholder="Qty" className={inputCls}
                      />
                      <input
                        {...register(`ingredients.${i}.unit` as const)}
                        placeholder="g"
                        className={inputCls}
                        onKeyDown={(e) => { if (e.key === "Enter") addIngredient(i + 1); }}
                      />
                      <div className="col-span-4 flex justify-end sm:col-span-1">
                        <RowButtons index={i} count={ingredientArray.fields.length} label="ingredient" onMove={ingredientArray.move} onRemove={() => ingredientArray.remove(i)} />
                      </div>
                    </div>
                    {ingErrors?.[i]?.name?.message && <p className="ml-7 mt-0.5 text-xs font-medium text-red-600">{ingErrors[i].name!.message}</p>}
                  </li>
                ))}
              </ul>
              {errors.ingredients?.message && <p className="mt-1 text-xs font-medium text-red-600">{errors.ingredients.message}</p>}
              <AddButton onClick={() => addIngredient()}>Add ingredient</AddButton>
            </div>
          </Section>

          <Section id="method" title="Method">
            <div data-edit="steps" className={targetCls}>
              <ol className="space-y-2">
                {stepArray.fields.map((field, i) => (
                  <li key={field.id} data-edit={`steps.${i}`} className={targetCls}>
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1F3D2D] text-[11px] font-bold text-white">{i + 1}</span>
                      <textarea {...register(`steps.${i}.body` as const)} rows={2} className={`${inputCls} flex-1`} placeholder="Describe this step…" />
                      <RowButtons index={i} count={stepArray.fields.length} label="step" onMove={stepArray.move} onRemove={() => stepArray.remove(i)} />
                    </div>
                    {stepErrors?.[i]?.body?.message && <p className="ml-8 mt-0.5 text-xs font-medium text-red-600">{stepErrors[i].body!.message}</p>}
                  </li>
                ))}
              </ol>
              {errors.steps?.message && <p className="mt-1 text-xs font-medium text-red-600">{errors.steps.message}</p>}
              <AddButton onClick={() => addStep()}>Add step</AddButton>
            </div>
          </Section>

          <Section id="mise" title="Mise en place" hint="Enter adds the next item">
            <StringListEditor control={control} name="miseEnPlace" itemLabel="item" placeholder="Wash and dry arugula" focusPath={focusPath} />
          </Section>

          <Section id="equipment" title="Equipment / tools">
            <StringListEditor control={control} name="equipment" itemLabel="tool" placeholder="Chilled serving plate" focusPath={focusPath} />
          </Section>

          <Section id="quality" title="Quality check">
            <StringListEditor control={control} name="qualityCheck" itemLabel="check" placeholder="Greens crisp" focusPath={focusPath} />
          </Section>
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-3">
          <div className="min-w-0 flex-1 text-xs">
            {formError ? (
              <p className="font-medium text-red-600">{formError}</p>
            ) : savedAt ? (
              <p className="font-medium text-emerald-600">Saved ✓</p>
            ) : isDirty ? (
              <p className="text-amber-600">Unsaved changes</p>
            ) : (
              <p className="text-slate-400">Click anything in the preview to edit it · Ctrl+S to save</p>
            )}
          </div>
          <button
            type="submit"
            disabled={pending || uploadingHero}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : initial?.id ? "Save changes" : "Create recipe"}
          </button>
        </div>
      </div>

      {/* ---------------- Live preview ---------------- */}
      <div className={`${mobileTab === "preview" ? "block" : "hidden"} min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-[#FAF8F5] shadow-sm lg:block`}>
        <LivePreview control={control} brands={brands} version={initial?.version} heroPreview={heroPreview} onPick={pickFromPreview} />
      </div>
    </form>
  );
}
