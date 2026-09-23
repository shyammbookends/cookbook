"use client";

import { useState } from "react";
import { asVariants, buildSrcSet, largestVariantUrl, type MediaLike } from "@/lib/media";

interface RecipeImageProps {
  media: MediaLike | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  aspect?: string; // e.g. "4 / 3", "16 / 9", "1 / 1"
}

/**
 * Renders pre-generated AVIF/WebP variants as a <picture>, with a blurred
 * dominant-colour placeholder while loading and a branded fallback tile if
 * there's no image or it fails to load. Fixed aspect ratio avoids layout
 * shift; `priority` skips lazy-loading for the LCP hero image.
 */
export function RecipeImage({ media, alt, sizes = "100vw", priority = false, className = "", aspect = "4 / 3" }: RecipeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasImage = !!media && asVariants(media.variants).length > 0 && !errored;

  if (!hasImage) {
    return (
      <div
        className={`flex items-center justify-center bg-brand-card-bg/60 text-brand-card-fg/40 ${className}`}
        style={{ aspectRatio: aspect }}
      >
        <span className="eyebrow">No image yet</span>
      </div>
    );
  }

  const avifSet = buildSrcSet(media, "avif");
  const webpSet = buildSrcSet(media, "webp");
  const fallbackSrc = largestVariantUrl(media) ?? "";

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
      {media.blurDataUrl && !loaded && (
        <img
          src={media.blurDataUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}
      <picture>
        {avifSet && <source type="image/avif" srcSet={avifSet} sizes={sizes} />}
        {webpSet && <source type="image/webp" srcSet={webpSet} sizes={sizes} />}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </picture>
    </div>
  );
}
