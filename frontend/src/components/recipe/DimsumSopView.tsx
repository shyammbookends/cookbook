"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { AIKO_FONTS_HREF, AIKO_PAGE } from "@/lib/sop/aiko";
import { DIMSUM_CSS, dimsumCardHtml, type DimsumCardData } from "@/lib/sop/aiko-dimsum";
import { FitToWidth } from "@/components/recipe/FitToWidth";

/**
 * The Aiko Dim Sum card on screen: the shared HTML (lib/sop/aiko-dimsum.ts) on
 * one A4 page, scaled down when a long SOP would otherwise overflow it.
 */
export function DimsumSopView({ data, editable = false }: { data: DimsumCardData; editable?: boolean }) {
  const html = useMemo(() => dimsumCardHtml(data, { editable }), [data, editable]);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const fit = () => {
      let f = 1;
      // A scaled card is laid out wider/narrower (width / f), which re-wraps text, so keep
      // re-measuring until its scaled height just fills the page (shrunk if long, grown up to 18% if short).
      for (let i = 0; i < 12; i++) {
        el.style.width = `${AIKO_PAGE.width / f}px`;
        el.style.minHeight = "0px";
        const scaled = el.scrollHeight * f;
        const target = AIKO_PAGE.height - 2;
        if (scaled <= target && (scaled >= target - 14 || f >= 1.18)) break;
        const next = Math.min(1.18, Math.max(0.5, f * (target / scaled)));
        if (Math.abs(next - f) < 0.002) break;
        f = next;
      }
      el.style.width = `${AIKO_PAGE.width / f}px`;
      el.style.minHeight = `${AIKO_PAGE.height / f}px`;
      el.style.transform = `scale(${f})`;
    };
    fit();
    const imgs = Array.from(el.querySelectorAll("img"));
    imgs.forEach((img) => img.addEventListener("load", fit));
    void document.fonts?.ready.then(fit);
    return () => imgs.forEach((img) => img.removeEventListener("load", fit));
  }, [html]);

  return (
    <FitToWidth width={AIKO_PAGE.width}>
      <link rel="stylesheet" href={AIKO_FONTS_HREF} precedence="default" />
      <style href="aiko-dimsum" precedence="default">{DIMSUM_CSS}</style>
      <div className="relative overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,.12)] print:shadow-none" style={{ width: AIKO_PAGE.width, height: AIKO_PAGE.height }}>
        <div ref={innerRef} className={`dm-root ${data.extras?.ramen ? "rm-root" : ""} absolute left-0 top-0 origin-top-left`} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </FitToWidth>
  );
}
