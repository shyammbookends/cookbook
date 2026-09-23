"use client";

import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op — clipboard may be unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-brand-fg/20 px-4 py-2 text-sm hover:border-brand-accent hover:text-brand-accent"
    >
      {copied ? "Link copied!" : "Share ↗"}
    </button>
  );
}
