"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { RecipeForm, type FormBrand, type RecipeFormHandle, type RecipeFormInitial } from "@/components/admin/RecipeForm";
import { ImportUploadForm } from "@/components/admin/ImportUploadForm";

/**
 * The admin portal's Add / Edit recipe page. The header holds Save Draft and
 * Save; the editor panel holds Import Excel, Import Image and Manual Edit (with
 * Save at its foot). The live card preview on the right is unchanged.
 */
export function RecipeWorkspace({
  brandSlug,
  brands,
  initial,
  title,
  back,
}: {
  brandSlug: string;
  brands: FormBrand[];
  initial?: RecipeFormInitial;
  title: string;
  back: { href: string; label: string };
}) {
  const formRef = useRef<RecipeFormHandle>(null);
  // Opens on Import Excel; Manual Edit is one click away.
  const [view, setView] = useState<"manual" | "excel">("excel");

  function saveDraft() {
    setView("manual");
    formRef.current?.saveDraft();
  }

  function save() {
    setView("manual");
    formRef.current?.save();
  }

  function importImage() {
    setView("manual");
    formRef.current?.pickHeroImage();
  }

  // Fixed neutral colours (not the brand theme) so the header buttons read on any brand background.
  const headerBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-lg ring-1 ring-black/10 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const editorTop = (
    <div className="flex gap-1 border-b border-slate-200 bg-slate-100 p-1.5">
      <Tab label="Import" icon={<SheetIcon />} onClick={() => setView("excel")} pressed={view === "excel"} />
      <Tab label="Manual Edit" icon={<PenIcon />} onClick={() => setView("manual")} pressed={view === "manual"} />
    </div>
  );

  const excelPanel = (
    <div className="text-slate-900">
      <h2 className="font-semibold">Import from Excel</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add or update one or many recipes from an .xlsx/.xls/.csv file — you&apos;ll see a preview before anything is saved.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler */}
      <a href="/api/admin/import/template" className="mb-4 mt-3 inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200">
        ↓ Download template
      </a>
      <ImportUploadForm compact jobHref={(jobId) => `/admin/${brandSlug}/manage/import/${jobId}`} />

      <div className="mt-6">
        <h2 className="font-semibold">Import Image</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">Add a photo for this recipe.</p>
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-5 text-center">
          <p className="mb-3 text-sm text-slate-700">Drop your image file here, or</p>
          <button
            type="button"
            onClick={importImage}
            className="inline-block cursor-pointer rounded-lg bg-[#C6E86B] px-5 py-2 text-sm font-semibold text-[#0A2399]"
          >
            Choose image
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <Link href={back.href} className="inline-flex items-center text-sm font-medium text-brand-fg/60 transition-colors hover:text-brand-accent">
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to {back.label}
      </Link>

      <div className="mb-5 mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-fg sm:text-4xl">{title}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={saveDraft} className={`${headerBtn} bg-white text-slate-900 hover:bg-slate-100`}>
            <SaveIcon />
            Save Draft
          </button>
          <button type="button" onClick={save} className={`${headerBtn} bg-slate-900 text-white hover:bg-black`}>
            <CheckIcon />
            Save
          </button>
        </div>
      </div>

      <div className="text-slate-900">
        <RecipeForm
          brands={brands}
          initial={initial}
          handleRef={formRef}
          portal
          hrefAfterCreate={(id) => `/admin/${brandSlug}/manage/${id}`}
          editorTop={editorTop}
          editorBody={view === "excel" ? excelPanel : undefined}
          onPickField={() => setView("manual")}
        />
      </div>
    </div>
  );
}

const iconProps = { className: "h-4 w-4 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function SheetIcon() {
  return <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>;
}
function SaveIcon() {
  return <svg {...iconProps}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>;
}
function CheckIcon() {
  return <svg {...iconProps}><path d="M20 6L9 17l-5-5" /></svg>;
}
function ImageIcon() {
  return <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
}
function PenIcon() {
  return <svg {...iconProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}

function Tab({ label, icon, onClick, pressed }: { label: string; icon: ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
        pressed ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
