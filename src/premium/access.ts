"use client";

/**
 * Access to the paid "Self-knowledge" content, in the browser: sign-in by a one-time email code,
 * the buyer's purchases, checkout, and the paid content itself.
 * The database only returns content to buyers (RLS); purchases are written by the Worker after payment.
 */
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/** Base of the payment API (worker/index.ts): the site's own origin in production. For local
 * development with `wrangler dev`, set NEXT_PUBLIC_API_BASE=http://localhost:8787. */
const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** The current session: undefined while it is being read, null when signed out. */
export function useSession(): Session | null | undefined {
  // Without a configured Supabase there is nobody to sign in: signed out from the start.
  const [session, setSession] = useState<Session | null | undefined>(() => (getSupabase() ? undefined : null));
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

/**
 * Sends a sign-in letter (the account is created on first sign-in). Supabase's standard letter holds
 * a link that brings the person back to this very page signed in; with the custom template
 * (supabase/email/magic-link.html, needs own SMTP) it also holds a one-time code.
 */
export async function sendCode(email: string) {
  const { error } = await getSupabase()!.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
  const { error } = await getSupabase()!.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function signOut() {
  await getSupabase()!.auth.signOut();
}

/** Slugs of the products the signed-in person owns (bought or granted by email); undefined while loading. */
export function useOwnedProducts(session: Session | null | undefined): Set<string> | undefined {
  const [loaded, setLoaded] = useState<{ userId: string; slugs: Set<string> } | null>(null);
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase()!;
    // Each table only returns the person's own rows.
    Promise.all([
      supabase.from("purchases").select("product_slug"),
      supabase.from("access_grants").select("product_slug"),
    ]).then((results) => {
      const slugs = results.flatMap(({ data }) => (data ?? []).map((row) => row.product_slug as string));
      setLoaded({ userId, slugs: new Set(slugs) });
    });
  }, [userId]);
  if (session === undefined) return undefined;
  if (!userId) return NOTHING_OWNED;
  return loaded?.userId === userId ? loaded.slugs : undefined;
}

const NOTHING_OWNED = new Set<string>();

/**
 * Asks the Worker for a signed WayForPay form and sends the buyer to the payment page.
 * Resolves to "owned" instead when the person already has the product.
 */
export async function startCheckout(product: string, locale: string, session: Session): Promise<"owned" | void> {
  const response = await fetch(`${apiBase}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ product, locale }),
  });
  if (response.status === 409) return "owned";
  if (!response.ok) throw new Error(`checkout ${response.status}`);
  const { action, fields } = (await response.json()) as { action: string; fields: Record<string, string> };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.acceptCharset = "utf-8";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

/** Paid content of a product in a language, or null when it is not bought (or not signed in). */
export async function loadPremiumContent<T>(product: string, locale: string): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("premium_content")
    .select("payload")
    .eq("product_slug", product)
    .eq("locale", locale)
    .maybeSingle();
  return (data?.payload as T | undefined) ?? null;
}
