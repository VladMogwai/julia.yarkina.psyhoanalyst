"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { getSupabase } from "@/lib/supabase/client";
import { rememberPending, signOut, startCheckout, takePending, useOwnedProducts, useSession } from "@/premium/access";
import { productLink, productPage } from "@/premium/products";
import { SignInForm } from "./SignInForm";

type Texts = Dictionary["selfKnowledge"];

interface Product {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price_uah: string;
  price_eur: string;
}

/** Ukrainian and Russian pages sell in hryvnias, the others in euros (the Worker charges the same way). */
function price(product: Product, locale: Locale) {
  const currency = locale === "uk" || locale === "ru" ? "UAH" : "EUR";
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(
    Number(currency === "EUR" ? product.price_eur : product.price_uah),
  );
}

/**
 * Products are read in the browser, so a price change shows at once, without rebuilding the site.
 * Buying while signed out opens the sign-in form first and continues to payment after it.
 */
export function ProductList({ locale, texts }: { locale: Locale; texts: Texts }) {
  const session = useSession();
  const owned = useOwnedProducts(session);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [waitingForSignIn, setWaitingForSignIn] = useState(false);
  const [error, setError] = useState("");
  const signInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSupabase()
      ?.from("products")
      .select("slug,title,description,price_uah,price_eur")
      .order("sort_order")
      .then(({ data }) => setProducts((data as Product[] | null) ?? []));
    // Signing in can reveal products that are not on sale yet but were granted to this email.
  }, [session]);

  async function buy(slug: string, current: Session) {
    try {
      if ((await startCheckout(slug, locale, current)) === "owned") setPending(null);
    } catch {
      setPending(null);
      setError(texts.checkoutError);
    }
  }

  // Signed in (by the code, or back from the link in the letter): continue the purchase started before.
  useEffect(() => {
    if (!session) return;
    const slug = takePending();
    if (!slug) return;
    startCheckout(slug, locale, session).catch(() => setError(texts.checkoutError));
  }, [session, locale, texts.checkoutError]);

  // Sign-in shows at once and stays with nothing on sale, for people who were given access by email.
  return (
    <div className="container-page grid gap-10">
      {!products && <p className="text-muted">{texts.loading}</p>}
      {products?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">{texts.empty}</p>
      )}
      <ul className="grid gap-6 md:grid-cols-2">
        {products?.map((product) => {
          const isOwned = owned?.has(product.slug);
          return (
            <li key={product.slug} className="flex flex-col rounded-2xl border border-line bg-white p-6 sm:p-8">
              <h2 className="font-serif text-3xl font-medium">{product.title[locale] ?? product.title.uk}</h2>
              <p className="mt-4 flex-1 leading-relaxed text-muted">
                {product.description[locale] ?? product.description.uk}
              </p>
              {productPage(product.slug, locale) && (
                <a href={productPage(product.slug, locale)!} className="link-underline mt-4 self-start text-sm font-semibold">
                  {texts.more}
                </a>
              )}
              <div className="mt-8 flex items-center justify-between gap-4">
                {isOwned ? (
                  <>
                    <span className="text-sm text-muted">{texts.owned}</span>
                    <a href={productLink(product.slug, locale) ?? "#"} className="button-primary">
                      {texts.open}
                    </a>
                  </>
                ) : (
                  <>
                    <span className="font-serif text-2xl">{price(product, locale)}</span>
                    <button
                      type="button"
                      disabled={pending === product.slug}
                      onClick={() => {
                        setError("");
                        if (session) {
                          setPending(product.slug);
                          buy(product.slug, session);
                          return;
                        }
                        rememberPending(product.slug);
                        setWaitingForSignIn(true);
                        signInRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        document.getElementById("sign-in-email")?.focus({ preventScroll: true });
                      }}
                      className="button-primary disabled:opacity-60"
                    >
                      {texts.buy}
                    </button>
                  </>
                )}
              </div>
              {!isOwned && <p className="mt-4 text-xs text-muted">{texts.terms}</p>}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <div ref={signInRef}>
        {session === null && (
          <>
            {waitingForSignIn && <p className="mb-4 text-lg">{texts.signInToBuy}</p>}
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
    </div>
  );
}
