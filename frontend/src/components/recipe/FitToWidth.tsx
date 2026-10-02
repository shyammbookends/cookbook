"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design width and zooms them down to fit a
 * narrower container, so a fixed layout (the A4 SOP card) looks identical on
 * phones. Never zooms above 1; print always uses the natural size.
 */
export function FitToWidth({ width, children }: { width: number; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const sizer = sizerRef.current;
    if (!box || !sizer) return;
    // Both are measured in the same coordinate space, so an ancestor's zoom cancels out.
    const update = () => setFit(Math.min(1, box.clientWidth / sizer.offsetWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden print:overflow-visible">
      <div ref={sizerRef} aria-hidden style={{ width }} className="pointer-events-none invisible absolute left-0 top-0 h-0" />
      <div style={{ width, ["--fit" as string]: fit }} className="mx-auto [zoom:var(--fit)] print:[zoom:1]">
        {children}
      </div>
    </div>
  );
}
