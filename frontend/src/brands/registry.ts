import type { ComponentType } from "react";

export type MotionPreset = "loud" | "slow-burn" | "calm" | "feral";

export interface BrandVisuals {
  Scene3D: ComponentType<{ accent: string; accentSoft: string }> | null;
  motionPreset: MotionPreset;
}

/**
 * Maps a brand slug to its bespoke hero scene. A brand with no entry here
 * (including any brand added later purely through the admin) falls back to
 * `generic`, which still looks good — it just isn't hand-tuned. This is the
 * "shared engine + brand config" extension point from the plan (§8).
 */
export async function getBrandVisuals(slug: string): Promise<BrandVisuals> {
  switch (slug) {
    case "capiche": {
      const { CapicheScene } = await import("@/brands/capiche/Scene");
      return { Scene3D: CapicheScene, motionPreset: "loud" };
    }
    case "aiko": {
      const { AikoScene } = await import("@/brands/aiko/Scene");
      return { Scene3D: AikoScene, motionPreset: "slow-burn" };
    }
    case "beshak": {
      const { BeshakScene } = await import("@/brands/beshak/Scene");
      return { Scene3D: BeshakScene, motionPreset: "calm" };
    }
    case "ghaslet": {
      const { GhasletScene } = await import("@/brands/ghaslet/Scene");
      return { Scene3D: GhasletScene, motionPreset: "feral" };
    }
    default: {
      const { GenericScene } = await import("@/brands/generic/Scene");
      return { Scene3D: GenericScene, motionPreset: "calm" };
    }
  }
}
