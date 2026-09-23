"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RecipeInputSchema, type RecipeInput, type RecipeFormValues, publishChecklist } from "@/lib/schemas/recipe";
import { parseIngredientBlock, parseStepBlock } from "@/lib/ingredientParser";
import { createRecipeAction, updateRecipeAction } from "@/app/admin/actions/recipe";
import { uploadMediaAction } from "@/app/admin/actions/media";

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
  tagNamesInitial?: string[];
}

const EMPTY: RecipeFormValues = {
  brandId: "", categoryId: null, externalId: null, slug: undefined, title: "", subtitle: null, excerpt: null,
  description: null, heroImageId: null, prepMinutes: null, cookMinutes: null, restMinutes: null, totalMinutes: null,
  servings: null, yieldText: null, difficulty: null, cuisine: null, course: null, dietary: [], spiceLevel: null,
  equipment: [], nutrition: null, notes: null, tips: null, dishCode: null, author: null, approvedBy: null, effectiveDate: null,
  nextReviewDate: null, miseEnPlace: [], plating: null, holding: null, allergens: null, customFields: {}, tagIds: [], ingredients: [], steps: [],
  galleryMediaIds: [], status: "DRAFT", publishAt: null, featured: false, seoTitle: null, seoDescription: null, noindex: false,
};

export function RecipeForm({ brands, initial }: { brands: FormBrand[]; initial?: RecipeFormInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(initial?.heroImagePreview ?? null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [ingredientPaste, setIngredientPaste] = useState("");
  const [prepPaste, setPrepPaste] = useState("");
  const [cookPaste, setCookPaste] = useState("");

  const {
    control, register, handleSubmit, watch, setValue, getValues,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeInputSchema),
    defaultValues: { ...EMPTY, ...initial, tagIds: initial?.tagIds ?? [] },
  });

  const ingredientArray = useFieldArray({ control, name: "ingredients" });
  const stepArray = useFieldArray({ control, name: "steps" });

  const brandId = watch("brandId");
  const currentBrand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId]);
  const [tagText, setTagText] = useState((initial?.tagNamesInitial ?? []).join(", "));

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    const fd = new FormData();
    fd.set("file", file);
    if (brandId) fd.set("brandId", brandId);
    fd.set("alt", getValues("title") || "");
    const result = await uploadMediaAction(fd);
    setUploadingHero(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setValue("heroImageId", result.data.id, { shouldDirty: true });
    setHeroPreview(URL.createObjectURL(file));
  }

  function applyIngredientPaste() {
    const groups = parseIngredientBlock(ingredientPaste);
    const rows = groups.flatMap((g, gi) =>
      g.lines.map((line, li) => ({
        position: gi * 1000 + li,
        groupLabel: g.groupLabel,
        quantity: line.quantity,
        quantityMax: line.quantityMax,
        unit: line.unit,
        name: line.name,
        note: line.note,
        raw: line.raw,
      })),
    );
    ingredientArray.replace(rows);
    setIngredientPaste("");
  }

  function applyStepPaste() {
    const prep = parseStepBlock(prepPaste).map((body, i) => ({ phase: "PREP" as const, position: i, body }));
    const cook = parseStepBlock(cookPaste).map((body, i) => ({ phase: "COOK" as const, position: i, body }));
    stepArray.replace([...prep, ...cook]);
    setPrepPaste("");
    setCookPaste("");
  }

  const values = watch();
  const checklist = publishChecklist(values);

  function onSubmit(raw: RecipeFormValues) {
    setFormError(null);
    const data: RecipeInput = RecipeInputSchema.parse(raw);
    const tagNames = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    startTransition(async () => {
      const result = initial?.id
        ? await updateRecipeAction(initial.id, { ...data, tagNames }, initial.version)
        : await createRecipeAction({ ...data, tagNames });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push(`/admin/recipes/${result.data.id}`);
      router.refresh();
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow";
  const labelCls = "mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <label className={labelCls}>Brand *</label>
          <select {...register("brandId")} className={inputCls}>
            <option value="">Select a brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {errors.brandId && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.brandId.message}</p>}

          <label className={`${labelCls} mt-4`}>Hero image</label>
          <div className="flex items-center gap-4">
            {heroPreview ? (
              <img src={heroPreview} alt="" className="h-20 w-20 rounded-lg object-cover shadow-sm border border-slate-200" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400 font-medium">
                No image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingHero}
              onChange={(e) => e.target.files?.[0] && handleHeroUpload(e.target.files[0])}
              className="text-xs"
            />
          </div>
          {uploadingHero && <p className="mt-1.5 text-xs text-blue-600 font-medium">Uploading…</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">Basics</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input {...register("title")} className={inputCls} />
              {errors.title && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.title.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input {...register("subtitle")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Card excerpt (≤220 chars)</label>
              <textarea {...register("excerpt")} rows={2} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea {...register("description")} rows={5} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <select {...register("categoryId")} className={inputCls}>
                  <option value="">None</option>
                  {currentBrand?.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Slug (auto if blank)</label>
                <input {...register("slug")} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input value={tagText} onChange={(e) => setTagText(e.target.value)} className={inputCls} placeholder="spicy, bestseller" />
              {currentBrand && currentBrand.tags.length > 0 && (
                <p className="mt-1.5 text-xs text-slate-500 font-medium">Existing: {currentBrand.tags.map((t) => t.name).join(", ")}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">SOP Details</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Dish Code</label>
              <input {...register("dishCode")} className={inputCls} placeholder="e.g. SL-01" />
            </div>
            <div>
              <label className={labelCls}>Author / Source</label>
              <input {...register("author")} className={inputCls} placeholder="e.g. Bookends Culinary" />
            </div>
            <div>
              <label className={labelCls}>Approved By</label>
              <input {...register("approvedBy")} className={inputCls} placeholder="e.g. Husen Khan" />
            </div>
            <div>
              <label className={labelCls}>Effective Date</label>
              <input type="date" {...register("effectiveDate", { valueAsDate: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Next Review Date</label>
              <input type="date" {...register("nextReviewDate", { valueAsDate: true })} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Mise En Place (comma separated)</label>
              <textarea
                {...register("miseEnPlace", {
                  setValueAs: (v: string | string[]) => {
                    if (Array.isArray(v)) return v;
                    return typeof v === 'string' && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
                  },
                })}
                className={inputCls}
                rows={2}
                placeholder="Wash and dry lettuce, Prepare Caesar mayo..."
                defaultValue={initial?.miseEnPlace?.join(", ")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Plating & Portioning</label>
              <textarea {...register("plating")} className={inputCls} rows={2} placeholder="Serve in salad bowl. Top with croutons..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Holding & Shelf Life</label>
              <textarea {...register("holding")} className={inputCls} rows={2} placeholder="Assemble to order. Do not pre-dress leaves." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Allergens</label>
              <textarea {...register("allergens")} className={inputCls} rows={2} placeholder="Contains: Gluten, Milk..." />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">Ingredients *</h2>
          <textarea
            value={ingredientPaste}
            onChange={(e) => setIngredientPaste(e.target.value)}
            rows={4}
            placeholder={"Paste a list, one per line:\n200g flour, sifted\n## For the sauce\n2 tbsp olive oil"}
            className={inputCls}
          />
          <button type="button" onClick={applyIngredientPaste} className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
            Parse into list ↓
          </button>
          {errors.ingredients && <p className="mt-3 text-xs text-red-500 font-medium">{errors.ingredients.message as string}</p>}

          <ul className="mt-4 space-y-2 overflow-x-auto">
            {ingredientArray.fields.map((field, i) => (
              <li key={field.id} className="grid min-w-[480px] grid-cols-[70px_60px_1fr_1fr_auto] gap-2 sm:min-w-0">
                <input {...register(`ingredients.${i}.quantity` as const, { valueAsNumber: true })} placeholder="Qty" className={inputCls} />
                <input {...register(`ingredients.${i}.unit` as const)} placeholder="Unit" className={inputCls} />
                <input {...register(`ingredients.${i}.name` as const)} placeholder="Ingredient" className={inputCls} />
                <input {...register(`ingredients.${i}.note` as const)} placeholder="Note" className={inputCls} />
                <button type="button" onClick={() => ingredientArray.remove(i)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">✕</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">Method *</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Prep steps (one per line)</label>
              <textarea value={prepPaste} onChange={(e) => setPrepPaste(e.target.value)} rows={4} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cook steps (one per line)</label>
              <textarea value={cookPaste} onChange={(e) => setCookPaste(e.target.value)} rows={4} className={inputCls} />
            </div>
          </div>
          <button type="button" onClick={applyStepPaste} className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
            Parse into steps ↓
          </button>
          {errors.steps && <p className="mt-3 text-xs text-red-500 font-medium">{errors.steps.message as string}</p>}

          <ol className="mt-5 space-y-3">
            {stepArray.fields.map((field, i) => (
              <li key={field.id} className="flex gap-2">
                <select {...register(`steps.${i}.phase` as const)} className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none">
                  <option value="PREP">Prep</option>
                  <option value="COOK">Cook</option>
                  <option value="FINISH">Finish</option>
                </select>
                <textarea {...register(`steps.${i}.body` as const)} rows={2} className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => stepArray.remove(i)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">✕</button>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">Metadata</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div><label className={labelCls}>Prep min</label><input type="number" {...register("prepMinutes", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Cook min</label><input type="number" {...register("cookMinutes", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Rest min</label><input type="number" {...register("restMinutes", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Total min (auto)</label><input type="number" {...register("totalMinutes", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Servings</label><input type="number" {...register("servings", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Yield text</label><input {...register("yieldText")} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select {...register("difficulty")} className={inputCls}>
                <option value="">—</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div><label className={labelCls}>Spice level (0–5)</label><input type="number" min={0} max={5} {...register("spiceLevel", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Cuisine</label><input {...register("cuisine")} className={inputCls} /></div>
            <div><label className={labelCls}>Course</label><input {...register("course")} className={inputCls} /></div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Dietary (comma separated)</label>
            <Controller
              control={control}
              name="dietary"
              render={({ field }) => (
                <input
                  defaultValue={field.value?.join(", ")}
                  onBlur={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  className={inputCls}
                  placeholder="Vegetarian, Jain"
                />
              )}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>Notes</label><textarea {...register("notes")} rows={2} className={inputCls} /></div>
            <div><label className={labelCls}>Tips</label><textarea {...register("tips")} rows={2} className={inputCls} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="mb-5 font-bold text-slate-900 text-lg">SEO</h2>
          <div className="space-y-4">
            <div><label className={labelCls}>SEO title (≤70)</label><input {...register("seoTitle")} className={inputCls} /></div>
            <div><label className={labelCls}>SEO description (≤170)</label><textarea {...register("seoDescription")} rows={2} className={inputCls} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("noindex")} /> Hide from search engines (noindex)</label>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <label className={labelCls}>Status</label>
          <select {...register("status")} className={inputCls}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" {...register("featured")} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> 
            Featured
          </label>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm shadow-sm">
            <p className="mb-3 font-bold text-slate-800">Publish checklist</p>
            <ul className="space-y-2">
              {["Title", "Brand", "Hero image", "At least one ingredient", "At least one step"].map((item) => (
                <li key={item} className={`flex items-center gap-2 ${checklist.missing.includes(item) ? "text-amber-600 font-medium" : "text-emerald-600 font-semibold"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${checklist.missing.includes(item) ? "border border-amber-300 bg-amber-50" : "bg-emerald-100"}`}>
                    {checklist.missing.includes(item) ? "!" : "✓"}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {formError && <p className="mt-4 text-sm font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100">{formError}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Saving…" : initial?.id ? "Save changes" : "Create recipe"}
          </button>
        </div>
      </aside>
    </form>
  );
}
