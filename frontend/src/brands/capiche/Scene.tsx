"use client";

import { BrandBlob } from "@/components/three/BrandBlob";

/** Capiche: fast, loud, a spinning "pizza slice" energy — icosahedron, high distortion, quick spin. */
export function CapicheScene({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return <BrandBlob accent={accent} accentSoft={accentSoft} geometry="icosahedron" speed={1.1} distort={0.5} roughness={0.4} />;
}
