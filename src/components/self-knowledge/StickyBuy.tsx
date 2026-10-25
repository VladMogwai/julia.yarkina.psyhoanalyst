"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useOwnedProducts, useSession } from "@/premium/access";
import { formatPrice, useProductPrice } from "./ProductCta";

interface StickyBuyProps {
  product: string;
  locale: Locale;
  label: string;
  /** Id of the purchase block the bar leads to; the bar hides while it is on screen. */
  target: string;
}

/** A buy bar pinned to the bottom of the screen, shown only while the product is on sale and not owned. */
export function StickyBuy({ product, locale, label, target }: StickyBuyProps) {
  const session = useSession();
  const owned = useOwnedProducts(session);
  const price = useProductPrice(product);
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const element = document.getElementById(target);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  if (!price || owned?.has(product) || targetVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 px-4 py-3 shadow-[0_-1px_0_#e5e5e5] backdrop-blur">
      <a href={`#${target}`} className="promo-button mx-auto flex w-full max-w-md justify-between">
        <span>{label}</span>
        <span>{formatPrice(price, locale)}</span>
      </a>
    </div>
  );
}
