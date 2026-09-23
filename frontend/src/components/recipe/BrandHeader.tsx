import Link from "next/link";
import type { Brand } from "@/generated/prisma/client";

export function BrandHeader({ brand }: { brand: Brand }) {
  return (
    <header className="sticky top-0 z-30 bg-black text-white print:hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4 sm:px-6">
        <Link 
          href="/" 
          className="mr-6 flex items-center text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Back to Portal"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Portal</span>
        </Link>
        <Link 
          href={`/${brand.slug}`} 
          className="text-3xl font-bold tracking-tight text-brand-bg font-[family-name:var(--font-script)]"
          style={{ color: 'var(--brand-bg)' }}
        >
          {brand.name}
        </Link>
        {/* Empty div for right-side balance if needed in future */}
        <div className="flex-1"></div>
      </div>
    </header>
  );
}
