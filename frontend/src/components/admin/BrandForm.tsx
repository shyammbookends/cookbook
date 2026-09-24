"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandInputSchema } from "@/lib/schemas/brand";
import type { BrandInput } from "@/lib/schemas/brand";
import { createBrandAction, updateBrandAction, setBrandStatusAction } from "@/app/admin/actions/brand";
import type { z } from "zod";

type FormValues = z.input<typeof BrandInputSchema>;

export function BrandForm({ id, initial }: { id?: string; initial?: Partial<FormValues> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, control } = useForm<FormValues>({
    resolver: zodResolver(BrandInputSchema),
    defaultValues: {
      slug: "", name: "", number: 1, status: "ACTIVE", sortOrder: 0,
      voiceWords: [], sampleLines: [],
      theme: { bg: "#111111", fg: "#ffffff", numeral: "#333333", accent: "#c6e86b", fontDisplay: "heavy", fontBody: "serif-italic", motion: "calm" },
      ...initial,
    },
  });

  const theme = watch("theme");
  const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#C6E86B]";
  const labelCls = "mb-1 block text-xs text-slate-500";

  function onSubmit(raw: FormValues) {
    setError(null);
    const data: BrandInput = BrandInputSchema.parse(raw);
    startTransition(async () => {
      const result = id ? await updateBrandAction(id, data) : await createBrandAction(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/brands/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Name</label><input {...register("name")} className={inputCls} /></div>
            <div><label className={labelCls}>Slug</label><input {...register("slug")} className={inputCls} /></div>
            <div><label className={labelCls}>Number</label><input type="number" {...register("number", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Sort order</label><input type="number" {...register("sortOrder", { valueAsNumber: true })} className={inputCls} /></div>
            <div><label className={labelCls}>Handle</label><input {...register("handle")} placeholder="@brand" className={inputCls} /></div>
            <div><label className={labelCls}>Follower label</label><input {...register("followerLabel")} placeholder="~22.1K" className={inputCls} /></div>
          </div>
          <div className="mt-3"><label className={labelCls}>Eyebrow</label><input {...register("eyebrow")} className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>Tagline</label><input {...register("tagline")} className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>Quote</label><textarea {...register("quote")} rows={2} className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>Description</label><textarea {...register("description")} rows={3} className={inputCls} /></div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Brand voice</h2>
          <p className="mb-4 text-xs text-slate-500">Shown on the brand&apos;s public page — its personality, mood, promise and real caption-style lines.</p>
          <div><label className={labelCls}>Personality (one line)</label><input {...register("personality")} placeholder="The charismatic friend who knows everyone at the party" className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>Mood &amp; feel (one line)</label><input {...register("moodFeel")} placeholder="Hot, fast, fun — my spot, my people" className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>Promise</label><input {...register("promise")} placeholder="Hot pies, big slices, very little nonsense." className={inputCls} /></div>
          <div className="mt-3">
            <label className={labelCls}>5 words that define the voice (comma separated)</label>
            <Controller
              control={control}
              name="voiceWords"
              render={({ field }) => (
                <input
                  defaultValue={field.value?.join(", ")}
                  onBlur={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  className={inputCls}
                  placeholder="Loud, Lowercase, Cheeky, Warm, Confident"
                />
              )}
            />
          </div>
          <div className="mt-3">
            <label className={labelCls}>Sample lines (one per line — real captions in the brand&apos;s voice)</label>
            <Controller
              control={control}
              name="sampleLines"
              render={({ field }) => (
                <textarea
                  defaultValue={field.value?.join("\n")}
                  onBlur={(e) => field.onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                  rows={5}
                  className={inputCls}
                  placeholder={"new pie just dropped. you know what to do ;)\nfold it or don't. just don't embarrass the slice."}
                />
              )}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Theme colours</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(["bg", "fg", "numeral", "accent", "accentSoft", "cardBg", "cardFg", "muted"] as const).map((key) => (
              <div key={key}>
                <label className={labelCls}>{key}</label>
                <div className="flex items-center gap-2">
                  <input type="color" {...register(`theme.${key}`)} className="h-8 w-10 rounded border border-slate-300 bg-transparent" />
                  <input {...register(`theme.${key}`)} className={`${inputCls} flex-1`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Display font</label>
              <select {...register("theme.fontDisplay")} className={inputCls}>
                <option value="heavy">Heavy</option>
                <option value="script">Script</option>
                <option value="marker">Marker</option>
                <option value="flared-serif">Flared serif</option>
                <option value="grotesk">Grotesk</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Body font</label>
              <select {...register("theme.fontBody")} className={inputCls}>
                <option value="serif-italic">Serif italic</option>
                <option value="sans">Sans</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Motion feel</label>
              <select {...register("theme.motion")} className={inputCls}>
                <option value="loud">Loud</option>
                <option value="slow-burn">Slow-burn</option>
                <option value="calm">Calm</option>
                <option value="feral">Feral</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">SEO</h2>
          <div><label className={labelCls}>SEO title</label><input {...register("seoTitle")} className={inputCls} /></div>
          <div className="mt-3"><label className={labelCls}>SEO description</label><textarea {...register("seoDescription")} rows={2} className={inputCls} /></div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-[#C6E86B] px-5 py-2 text-sm font-semibold text-[#0A2399] disabled:opacity-60">
          {pending ? "Saving…" : id ? "Save changes" : "Create brand"}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="sticky top-6 rounded-2xl border border-slate-200 p-5" style={{ background: theme?.bg, color: theme?.fg }}>
          <p className="eyebrow" style={{ color: theme?.accent }}>Live preview</p>
          <p className="mt-3 text-3xl font-bold">{watch("name") || "Brand name"}</p>
          <p className="quote-serif mt-2 text-sm opacity-80">{watch("quote") || "Quote preview…"}</p>
          {id && (
            <div className="mt-6 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => startTransition(() => setBrandStatusAction(id, "ACTIVE").then(() => router.refresh()))}
                className="rounded-full border px-3 py-1"
                style={{ borderColor: theme?.fg }}
              >
                Set active
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setBrandStatusAction(id, "HIDDEN").then(() => router.refresh()))}
                className="rounded-full border px-3 py-1"
                style={{ borderColor: theme?.fg }}
              >
                Hide
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
