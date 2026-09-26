"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { getSupabase } from "@/lib/supabase/client";
import { useSession } from "@/premium/access";
import { productLink } from "@/premium/products";
import { SignInForm } from "./SignInForm";

type Texts = Dictionary["selfKnowledge"];
type Status = "loading" | "created" | "approved" | "declined" | "unknown";

/** How long to wait for the payment callback before telling the buyer to write to us. */
const POLL_MS = 2000;
const POLL_LIMIT = 45;

/**
 * After WayForPay: the order is followed until the callback confirms it. The payment page returns
 * the buyer here straight away, while the confirmation may arrive a few seconds later.
 */
export function ThanksStatus({ locale, texts }: { locale: Locale; texts: Texts }) {
  const session = useSession();
  const [status, setStatus] = useState<Status>("loading");
  const [product, setProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const reference = new URLSearchParams(window.location.search).get("order") ?? "";
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      const { data } = await getSupabase()!
        .from("orders")
        .select("status,product_slug")
        .eq("reference", reference)
        .maybeSingle();
      if (!data) return setStatus("unknown");
      setProduct(data.product_slug);
      if (data.status === "approved") return setStatus("approved");
      if (data.status !== "created") return setStatus("declined");
      setStatus("created");
      if (++attempts < POLL_LIMIT) timer = setTimeout(check, POLL_MS);
      else setStatus("unknown");
    }
    check();
    return () => clearTimeout(timer);
  }, [session]);

  if (session === null) {
    return (
      <div className="grid gap-6">
        <p className="text-lg text-muted">{texts.thanksSignIn}</p>
        <SignInForm texts={texts} />
      </div>
    );
  }

  const back = (
    <a href={`/${locale}/self-knowledge/`} className="link-underline">
      {texts.backToSection}
    </a>
  );

  return (
    <div className="grid justify-items-start gap-6 text-lg">
      {(status === "loading" || status === "created") && <p className="text-muted">{texts.thanksPending}</p>}
      {status === "approved" && (
        <>
          <p>{texts.thanksApproved}</p>
          {product && productLink(product, locale) && (
            <a href={productLink(product, locale)!} className="button-primary">
              {texts.open}
            </a>
          )}
        </>
      )}
      {status === "declined" && <p>{texts.thanksDeclined}</p>}
      {status === "unknown" && <p>{texts.thanksUnknown}</p>}
      {status !== "approved" && back}
    </div>
  );
}
