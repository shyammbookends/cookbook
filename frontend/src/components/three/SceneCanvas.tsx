"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
  /** Plain CSS fallback shown on reduced-motion, Save-Data, or before the canvas has mounted. */
  fallback?: ReactNode;
}

function prefersNoMotion(): boolean {
  if (typeof window === "undefined") return true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
  return reduced || saveData;
}

/**
 * Lazy-mounts a WebGL scene only once it scrolls into view, and never at
 * all under reduced-motion / Save-Data — those visitors get `fallback`
 * (a plain CSS gradient) instead. Pauses rendering while off-screen.
 */
export function SceneCanvas({ children, className, fallback }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [inView, setInView] = useState(false);
  const [skip, setSkip] = useState(true); // default true until we've checked, to avoid a flash on low-power devices

  useEffect(() => {
    // Reading matchMedia/navigator.connection is a browser-only check that
    // can't run during SSR — this mount-only effect is the standard way to
    // sync that into state without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSkip(prefersNoMotion());
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || skip) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setShouldMount(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [skip]);

  return (
    <div ref={containerRef} className={className}>
      {skip || !shouldMount ? (
        fallback ?? <div className="h-full w-full" />
      ) : (
        <Suspense fallback={fallback ?? <div className="h-full w-full" />}>
          <Canvas
            dpr={[1, 1.5]}
            frameloop={inView ? "always" : "never"}
            gl={{ antialias: true, powerPreference: "low-power" }}
            camera={{ position: [0, 0, 6], fov: 40 }}
          >
            {children}
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
