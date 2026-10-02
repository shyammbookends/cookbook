"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandInputSchema, type BrandInput } from "@/lib/schemas/brand";
import type { BrandTheme } from "@/lib/schemas/theme";
import { createBrandAction, updateBrandAction } from "@/app/admin/actions/brand";
import { toSlug } from "@/lib/slug";
import { SOP_TEMPLATES, sopTemplateOf, type SopTemplateKey } from "@/lib/sop/templates";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(v: string): string | null {
  const m = v.trim().match(HEX);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return `#${h.toUpperCase()}`;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes `hex` toward `to` by `t` (0–1). */
function mix(hex: string, to: string, t: number): string {
  const a = rgb(hex);
  const b = rgb(to);
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * t).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A whole brand theme from one colour: readable text, a tinted accent and numeral, a light recipe card. */
export function themeFromColor(hex: string, base?: Partial<BrandTheme>): BrandTheme {
  const light = luminance(hex) > 0.4;
  return {
    fontDisplay: base?.fontDisplay ?? "heavy",
    fontBody: base?.fontBody ?? "serif-italic",
    motion: base?.motion ?? "calm",
    bg: hex,
    fg: light ? "#111111" : "#FFFFFF",
    numeral: mix(hex, "#000000", light ? 0.18 : 0.35),
    accent: light ? mix(hex, "#000000", 0.6) : mix(hex, "#FFFFFF", 0.7),
    cardBg: mix(hex, "#FFFFFF", 0.88),
    cardFg: "#1A1A1A",
  };
}

type Initial = Partial<BrandInput> & { theme?: BrandTheme };

/** The admin portal's brand form: name, number, slug and one colour code — the theme is derived from it. */
export function SimpleBrandForm({ id, initial, savedHrefBase }: { id?: string; initial?: Initial; savedHrefBase: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState(String(initial?.number ?? ""));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [color, setColor] = useState(initial?.theme?.bg ?? "#111111");
  const [template, setTemplate] = useState<SopTemplateKey>(sopTemplateOf(initial?.theme));

  const hex = normalizeHex(color);
  // Editing keeps the existing (possibly hand-tuned) theme until the colour actually changes.
  const theme = hex ? (initial?.theme && hex === normalizeHex(initial.theme.bg) ? initial.theme : themeFromColor(hex, initial?.theme)) : null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!theme) return setError("Enter a valid colour code, e.g. #EF1C25.");
    const parsed = BrandInputSchema.safeParse({
      voiceWords: [],
      sampleLines: [],
      status: "ACTIVE",
      ...initial,
      name,
      number: Number(number),
      slug,
      theme: { ...theme, sopTemplate: template },
      sortOrder: initial?.sortOrder ?? Number(number),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return setError(`${String(issue.path[0] ?? "Form")}: ${issue.message}`);
    }
    startTransition(async () => {
      const result = id ? await updateBrandAction(id, parsed.data) : await createBrandAction(parsed.data);
      if (!result.ok) return setError(result.error);
      router.push(`${savedHrefBase}/${result.data.id}`);
      router.refresh();
    });
  }

  const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_140px]">
          <div>
            <label htmlFor="brand-name" className={labelCls}>Brand name</label>
            <input
              id="brand-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(toSlug(e.target.value));
              }}
              className={inputCls}
              placeholder="Capiche"
              required
            />
          </div>
          <div>
            <label htmlFor="brand-number" className={labelCls}>No.</label>
            <input id="brand-number" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} placeholder="5" required />
          </div>
        </div>

        <div>
          <label htmlFor="brand-slug" className={labelCls}>Slug</label>
          <input
            id="brand-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className={`${inputCls} font-mono`}
            placeholder="capiche"
            required
          />
          <p className="mt-1 text-xs text-slate-500">Used in the web address: /{slug || "slug"}</p>
        </div>

        <div>
          <label htmlFor="brand-color" className={labelCls}>Colour code</label>
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-black/15" style={{ background: hex ?? "transparent" }} aria-hidden />
            <input
              id="brand-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={`${inputCls} font-mono uppercase ${hex ? "" : "border-red-400 focus:border-red-500"}`}
              placeholder="#EF1C25"
              required
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Text, accent and card colours are set automatically from this.</p>
        </div>

        <div>
          <label htmlFor="brand-template" className={labelCls}>Recipe card design</label>
          <select id="brand-template" value={template} onChange={(e) => setTemplate(e.target.value as SopTemplateKey)} className={inputCls}>
            {SOP_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Every recipe of this brand is shown and printed in this design.</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

        <button type="submit" disabled={pending} className="w-full rounded-xl bg-slate-900 px-5 py-3 text-base font-bold text-white hover:bg-black disabled:opacity-60 sm:w-auto">
          {pending ? "Saving…" : id ? "Save brand" : "Add brand"}
        </button>
      </form>

      {/* Live preview — the brand card as it appears on the portal home. */}
      <div>
        <p className="mb-2 text-sm font-semibold text-brand-fg/80">Preview</p>
        <div className="relative h-[155px] overflow-hidden rounded-3xl p-6 shadow-lg" style={{ background: theme?.bg ?? "#111111", color: theme?.fg ?? "#FFFFFF" }}>
          <p className="eyebrow truncate" style={{ color: theme?.accent }}>BRAND {String(Number(number) || 0).padStart(2, "0")}</p>
          <span aria-hidden className="absolute -bottom-3 left-5 select-none text-8xl font-black leading-none tracking-tighter opacity-30" style={{ color: theme?.numeral }}>
            {String(Number(number) || 0).padStart(2, "0")}
          </span>
          <p className="absolute bottom-5 left-6 text-3xl font-bold tracking-tight">{name || "Brand name"}</p>
        </div>
        <div className="mt-3 rounded-2xl p-4 shadow-md" style={{ background: theme?.cardBg ?? "#FFFFFF", color: theme?.cardFg ?? "#1A1A1A" }}>
          <p className="eyebrow" style={{ color: theme?.accent }}>Recipe card</p>
          <p className="mt-1 text-lg font-bold">Sample recipe</p>
        </div>
      </div>
    </div>
  );
}
