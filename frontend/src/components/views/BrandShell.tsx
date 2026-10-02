import type { ReactNode } from "react";
import type { Brand } from "@/generated/prisma/client";
import { BrandThemeSchema, themeToCssVars } from "@/lib/schemas/theme";
import { BrandHeader } from "@/components/recipe/BrandHeader";
import { BrandFooter } from "@/components/recipe/BrandFooter";

/** Brand theme + header/footer around every brand page, public (base "") or admin (base "/admin"). */
export function BrandShell({ brand, base = "", children }: { brand: Brand; base?: string; children: ReactNode }) {
  const theme = BrandThemeSchema.parse(brand.theme);
  const cssVars = themeToCssVars(theme);

  return (
    <div data-brand={brand.slug} style={cssVars as React.CSSProperties} className="flex min-h-screen flex-col print:!bg-[#FAF8F5]">
      <BrandHeader brand={brand} base={base} />
      <main className="flex-1">{children}</main>
      <BrandFooter brand={brand} />
    </div>
  );
}
