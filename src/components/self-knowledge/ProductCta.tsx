"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { getSupabase } from "@/lib/supabase/client";
import {
  rememberPending,
  signOut,
  startCheckout,
  takePending,
  useOwnedProducts,
  useSession,
} from "@/premium/access";
import { productLink } from "@/premium/products";
import { SignInForm } from "./SignInForm";

type Texts = Dictionary["selfKnowledge"];

interface ProductCtaProps {
  product: string;
  locale: Locale;
  texts: Texts;
  /** Label of the link for people who already have the product. */
  openLabel: string;
  /** Shown while the product is not on sale. */
  soonLabel: string;
  /**
   * The block that holds the sign-in form (one per page). A purchase started anywhere on the page
   * while signed out continues from here once the person has signed in.
   */
  withSignIn?: boolean;
}

const SIGN_IN_ID = "sign-in";

/** "Buy" with the price, or "Go to the questions" for people who own the product. */
export function ProductCta({ product, locale, texts, openLabel, soonLabel, withSignIn = false }: ProductCtaProps) {
  const session = useSession();
  const owned = useOwnedProducts(session);
  // undefined while loading, null when not on sale (hidden products are not returned).
  const [price, setPrice] = useState<{ uah: string; eur: string } | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      ?.from("products")
      .select("price_uah,price_eur")
      .eq("slug", product)
      .maybeSingle()
      .then(({ data }) => setPrice(data ? { uah: data.price_uah, eur: data.price_eur } : null));
  }, [product]);

  useEffect(() => {
    if (!withSignIn || !session) return;
    const slug = takePending();
    if (slug) startCheckout(slug, locale, session).catch(() => setError(texts.checkoutError));
  }, [withSignIn, session, locale, texts.checkoutError]);

  async function buy() {
    setError("");
    if (!session) {
      rememberPending(product);
      document.getElementById(SIGN_IN_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("sign-in-email")?.focus({ preventScroll: true });
      return;
    }
    setBusy(true);
    try {
      await startCheckout(product, locale, session);
    } catch {
      setError(texts.checkoutError);
    } finally {
      setBusy(false);
    }
  }

  const isOwned = owned?.has(product);
  const currency = locale === "uk" || locale === "ru" ? "UAH" : "EUR";

  return (
    <div className="grid justify-items-start gap-4">
      {isOwned ? (
        <a href={productLink(product, locale) ?? "#"} className="button-primary">
          {openLabel}
        </a>
      ) : price ? (
        <div className="flex flex-wrap items-center gap-5">
          <span className="font-serif text-3xl">
            {new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(
              Number(currency === "EUR" ? price.eur : price.uah),
            )}
          </span>
          <button type="button" onClick={buy} disabled={busy} className="button-primary disabled:opacity-60">
            {texts.buy}
          </button>
        </div>
      ) : (
        price === null && <p className="text-muted">{soonLabel}</p>
      )}
      {!isOwned && price && (
        <p className="text-xs text-muted">
          {texts.terms.split("{offer}")[0]}
          <a href={`/${locale}/legal/offer`} className="underline hover:text-ink">
            {texts.termsOffer}
          </a>
          {texts.terms.split("{offer}")[1]}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      {withSignIn && (
        <div id={SIGN_IN_ID} className="w-full max-w-2xl">
          {session === null && (
            <>
              {price && <p className="text-muted">{texts.signInToBuy}</p>}
              <p className="mb-4 text-muted">{texts.alreadyBought}</p>
              <SignInForm texts={texts} />
            </>
          )}
          {session && (
            <p className="text-sm text-muted">
              {texts.signedInAs.replace("{email}", session.user.email ?? "")} ·{" "}
              <button type="button" onClick={() => signOut()} className="link-underline">
                {texts.signOut}
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
