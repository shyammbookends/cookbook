"use client";

import { BrandBlob } from "@/components/three/BrandBlob";

/** Fallback hero for any brand without a bespoke scene (including future brands added via admin only). */
export function GenericScene({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return <BrandBlob accent={accent} accentSoft={accentSoft} geometry="icosahedron" speed={0.35} distort={0.3} />;
}
