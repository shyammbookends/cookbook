"use client";

import { useEffect } from "react";

export function SuppressWarnings() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
          return;
        }
        originalWarn(...args);
      };
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);
  return null;
}
