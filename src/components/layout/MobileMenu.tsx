"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/** Disclosure menu for small screens; closes itself after client-side navigation. */
export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <details ref={detailsRef} className="relative md:hidden">
      <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{label}</span>
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </summary>
      <div className="absolute right-0 z-20 mt-3 flex w-56 flex-col gap-1 rounded-2xl border border-line bg-cream p-3 shadow-lg">
        {children}
      </div>
    </details>
  );
}
