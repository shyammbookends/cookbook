import type { Brand } from "@/generated/prisma/client";

export function BrandFooter({ brand }: { brand: Brand }) {
  return (
    <footer className="mt-24 border-t border-white/10 py-10 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-brand-fg/60 sm:px-6">
        <p className="eyebrow">
          {brand.handle} {brand.followerLabel ? `· ${brand.followerLabel}` : ""}
        </p>
        <p>© {new Date().getFullYear()} {brand.name}. A Bookends Hospitality house.</p>
      </div>
    </footer>
  );
}
