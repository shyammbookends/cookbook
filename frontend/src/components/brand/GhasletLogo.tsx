import type { CSSProperties } from "react";

interface GhasletLogoProps {
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function GhasletLogo({
  className = "",
  style = {},
  alt = "Ghaslet",
}: GhasletLogoProps) {
  return (
    <img
      src="/brands/ghaslet-white-2x.png"
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      style={{ aspectRatio: "393 / 280", ...style }}
      loading="eager"
      decoding="async"
    />
  );
}
