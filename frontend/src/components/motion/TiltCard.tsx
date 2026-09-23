"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";

/**
 * A cheap, no-WebGL 3D effect for recipe cards: CSS perspective tilt that
 * follows the pointer, plus a light "glare" gradient. Disabled entirely
 * under reduced-motion (the spring targets stay at rest, no listeners).
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 200, damping: 20, mass: 0.4 };
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), springConfig);
  const glareX: MotionValue<string> = useTransform(x, (v) => `${v * 100}%`);
  const glareY: MotionValue<string> = useTransform(y, (v) => `${v * 100}%`);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${className ?? ""}`}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.25), transparent 55%)`,
        }}
      />
    </motion.div>
  );
}
