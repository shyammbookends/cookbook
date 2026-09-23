"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const MAGNET_STRENGTH = 0.06; // fraction of pointer offset from centre
const MAGNET_MAX = 8; // px
const EXIT_MS = 280;

/** Fades the portal page in on arrival, so returning from a brand page doesn't snap. */
export function PortalPageFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Homepage brand card: magnetic pull toward a fine pointer, a subtle press on
 * tap/click, and a short brand-coloured fade before navigating to the brand page.
 * Magnetic pull is skipped on touch / coarse pointers and under reduced motion.
 */
export function BrandCardLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [canMagnet, setCanMagnet] = useState(false);
  const [exitColor, setExitColor] = useState<string | null>(null);

  const spring = { stiffness: 150, damping: 18, mass: 0.5 };
  const x = useSpring(useMotionValue(0), spring);
  const y = useSpring(useMotionValue(0), spring);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanMagnet(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Clear the exit curtain if this page is shown again (e.g. back navigation).
  useEffect(() => {
    setExitColor(null);
    return () => setExitColor(null);
  }, []);

  const magnetic = canMagnet && !reduce;

  function handlePointerEnter(e: PointerEvent<HTMLDivElement>) {
    if (!magnetic || e.pointerType !== "mouse") return;
    rectRef.current = e.currentTarget.getBoundingClientRect();
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!magnetic || e.pointerType !== "mouse") return;
    const rect = rectRef.current ?? (rectRef.current = e.currentTarget.getBoundingClientRect());
    const dx = (e.clientX - (rect.left + rect.width / 2)) * MAGNET_STRENGTH;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * MAGNET_STRENGTH;
    x.set(Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dx)));
    y.set(Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dy)));
  }

  function handlePointerLeave() {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab / modified clicks normally.
    if (reduce || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const el = linkRef.current;
    const color = el ? getComputedStyle(el).getPropertyValue("--brand-bg").trim() : "";
    setExitColor(color || "#0b0b0f");
    window.setTimeout(() => router.push(href), EXIT_MS);
  }

  return (
    <motion.div
      className="h-full"
      style={{ x, y }}
      whileTap={reduce ? undefined : { scale: 0.975 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Link ref={linkRef} href={href} className={className} style={style} onClick={handleClick}>
        {children}
      </Link>
      {exitColor !== null &&
        createPortal(
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[100]"
            style={{ background: exitColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: EXIT_MS / 1000, ease: EASE }}
          />,
          document.body,
        )}
    </motion.div>
  );
}
