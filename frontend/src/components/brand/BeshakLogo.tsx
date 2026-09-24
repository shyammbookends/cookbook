import type { CSSProperties } from "react";

interface BeshakLogoProps {
  color?: "white" | "red";
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function BeshakLogo({
  color = "white",
  className = "",
  style = {},
  alt = "Beshak",
}: BeshakLogoProps) {
  const src = color === "red" ? "/brands/beshak-red-2x.png" : "/brands/beshak-white-2x.png";

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      style={{ aspectRatio: "694 / 98", ...style }}
      loading="eager"
      decoding="async"
    />
  );
}
