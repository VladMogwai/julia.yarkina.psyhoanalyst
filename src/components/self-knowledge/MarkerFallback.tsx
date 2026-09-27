"use client";

import { useEffect } from "react";

/**
 * Browsers without scroll-driven animations (Firefox) get the marker highlights from an
 * IntersectionObserver instead: a note is highlighted while it is fully on screen. No scroll handlers.
 */
export function MarkerFallback() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).style.setProperty("--highlighted", entry.isIntersecting ? "1" : "0");
        }
      },
      { threshold: 1 },
    );
    const notes = document.querySelectorAll<HTMLElement>("mark[data-author]");
    // Start unmarked, so the first ones fill in as they are seen rather than being there already.
    notes.forEach((note) => {
      note.style.setProperty("--highlighted", "0");
      observer.observe(note);
    });
    return () => observer.disconnect();
  }, []);
  return null;
}
