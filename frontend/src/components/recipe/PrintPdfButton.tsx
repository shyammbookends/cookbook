"use client";

export function PrintPdfButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded border border-black/20 bg-white/50 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-black transition-colors hover:bg-black/5"
    >
      Download PDF
    </button>
  );
}
