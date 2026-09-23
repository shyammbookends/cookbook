"use client";

import { Reveal, RevealGroup, revealItemVariants } from "@/components/motion/Reveal";
import { motion } from "motion/react";

interface BrandVoiceProps {
  personality?: string | null;
  moodFeel?: string | null;
  promise?: string | null;
  voiceWords?: string[];
  sampleLines?: string[];
}

/**
 * "Who this brand is" — personality, mood, voice and a wall of real
 * caption-style lines, sourced from the group's brand-voice document.
 * Shared between each brand's own page and the portal homepage.
 */
export function BrandVoice({ personality, moodFeel, promise, voiceWords = [], sampleLines = [] }: BrandVoiceProps) {
  const hasAnything = personality || moodFeel || promise || voiceWords.length > 0 || sampleLines.length > 0;
  if (!hasAnything) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-14">
        <div>
          <Reveal>
            <p className="eyebrow text-brand-accent">The voice</p>
          </Reveal>
          {personality && (
            <Reveal delay={0.06}>
              <p className="quote-serif mt-4 text-xl leading-relaxed text-brand-fg sm:text-2xl">&ldquo;{personality}&rdquo;</p>
            </Reveal>
          )}
          {moodFeel && (
            <Reveal delay={0.1}>
              <p className="mt-4 text-sm text-brand-fg/70">{moodFeel}</p>
            </Reveal>
          )}
          {voiceWords.length > 0 && (
            <Reveal delay={0.14}>
              <div className="mt-6 flex flex-wrap gap-2">
                {voiceWords.map((w) => (
                  <span
                    key={w}
                    className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </Reveal>
          )}
          {promise && (
            <Reveal delay={0.18}>
              <p className="mt-8 border-t border-brand-fg/10 pt-6 text-lg font-bold leading-snug text-brand-fg sm:text-xl">
                {promise}
              </p>
            </Reveal>
          )}
        </div>

        {sampleLines.length > 0 && (
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.06}>
            {sampleLines.map((line, i) => (
              <motion.div
                key={i}
                variants={revealItemVariants}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl bg-brand-card-bg p-5 text-brand-card-fg shadow-sm"
              >
                <span className="mb-2 block text-2xl leading-none text-brand-accent opacity-70" aria-hidden>
                  &ldquo;
                </span>
                <p className="quote-serif text-sm leading-relaxed sm:text-base">{line}</p>
              </motion.div>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}
