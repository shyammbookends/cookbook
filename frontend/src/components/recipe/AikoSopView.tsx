"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { AIKO_CSS, AIKO_FONTS_HREF, AIKO_PAGE, aikoCardHtml, type AikoCardData } from "@/lib/sop/aiko";
import { FitToWidth } from "@/components/recipe/FitToWidth";

/**
 * The Aiko card on screen: the shared HTML (lib/sop/aiko.ts) on one A4 page.
 * Long SOPs are laid out wider and scaled down until they fit the page
 * height, the same way the printable PDF does it.
 */
export function AikoSopView({ data, editable = false }: { data: AikoCardData; editable?: boolean }) {
  const html = useMemo(() => aikoCardHtml(data, { editable }), [data, editable]);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const fit = () => {
      let f = 1;
      for (let i = 0; i < 4; i++) {
        el.style.width = `${AIKO_PAGE.width / f}px`;
        el.style.minHeight = "0px";
        const next = Math.min(1, AIKO_PAGE.height / el.scrollHeight);
        if (Math.abs(next - f) < 0.002) break;
        f = next;
      }
      el.style.width = `${AIKO_PAGE.width / f}px`;
      el.style.minHeight = `${AIKO_PAGE.height / f}px`;
      el.style.transform = `scale(${f})`;
    };
    fit();
    // Fonts and the photo change the layout once they load.
    const imgs = Array.from(el.querySelectorAll("img"));
    imgs.forEach((img) => img.addEventListener("load", fit));
    void document.fonts?.ready.then(fit);
    return () => imgs.forEach((img) => img.removeEventListener("load", fit));
  }, [html]);

  return (
    <FitToWidth width={AIKO_PAGE.width}>
      {/* React 19 hoists and de-duplicates these. */}
      <link rel="stylesheet" href={AIKO_FONTS_HREF} precedence="default" />
      <style href="aiko-sop" precedence="default">{AIKO_CSS}</style>
      <div className="relative overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,.12)] print:shadow-none" style={{ width: AIKO_PAGE.width, height: AIKO_PAGE.height }}>
        <div ref={innerRef} className="ak-root absolute left-0 top-0 origin-top-left" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </FitToWidth>
  );
}
