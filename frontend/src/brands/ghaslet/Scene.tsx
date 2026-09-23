"use client";

import { BrandBlob } from "@/components/three/BrandBlob";

/** Ghaslet: feral — a fast, erratic, heat-haze-distorted block, like a jerry can catching light. */
export function GhasletScene({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return <BrandBlob accent={accent} accentSoft={accentSoft} geometry="box" speed={1.4} distort={0.6} roughness={0.3} metalness={0.2} />;
}
