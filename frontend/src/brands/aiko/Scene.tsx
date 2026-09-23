"use client";

import { BrandBlob } from "@/components/three/BrandBlob";

/** Aiko: slow-burn — a gently rippling sphere, like steam off a bowl. */
export function AikoScene({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return <BrandBlob accent={accent} accentSoft={accentSoft} geometry="sphere" speed={0.25} distort={0.25} roughness={0.6} metalness={0.05} />;
}
