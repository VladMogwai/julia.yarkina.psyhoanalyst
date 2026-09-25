"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initScrollGalleries, waitForGalleryImages } from "./scroll-galleries";
import "./scroll-gallery.css";

/** Wraps page content that contains `.gallery-wrap` sections and runs their scroll animations. */
export function ScrollGalleries({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // Flip must measure final layouts with real images, so start only after they are decoded.
    waitForGalleryImages(root).then(() => {
      if (!cancelled) cleanup = initScrollGalleries(root);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
