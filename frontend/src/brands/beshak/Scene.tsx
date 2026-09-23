"use client";

import { BrandBlob } from "@/components/three/BrandBlob";

/** Beshak: calm — a slowly turning vermilion disc/sun on navy, matching the brand mark. */
export function BeshakScene({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return <BrandBlob accent={accent} accentSoft={accentSoft} geometry="sphere" speed={0.15} distort={0.08} roughness={0.5} metalness={0.1} />;
}
