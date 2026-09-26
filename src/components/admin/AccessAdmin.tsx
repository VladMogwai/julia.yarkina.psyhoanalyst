"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";
import { Button, ErrorMessage, Field, inputClass } from "./ui";

interface Grant {
  email: string;
  product_slug: string;
  note: string;
  created_at: string;
}

interface Product {
  slug: string;
  title: Record<string, string>;
}

/**
 * Paid content opened by hand: an email and a product. The person signs in on the site with that
 * email (by a code sent to it) and gets the product as if bought. Changes apply at once, no rebuild.
 */
export function AccessAdmin({ supabase }: { supabase: SupabaseClient }) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    Promise.all([
      supabase.from("access_grants").select("email,product_slug,note,created_at").order("created_at", { ascending: false }),
      // Admins see hidden products too, so access can be given before a product goes on sale.
      supabase.from("products").select("slug,title").order("sort_order"),
    ]).then(([grantsResult, productsResult]) => {
      if (isCancelled) return;
      if (grantsResult.error || productsResult.error) {
        setError((grantsResult.error ?? productsResult.error)!.message);
        return;
      }
      setGrants(grantsResult.data as Grant[]);
      setProducts(productsResult.data as Product[]);
    });
    return () => {
      isCancelled = true;
    };
  }, [supabase, reloadKey]);

  const titleOf = (slug: string) => products.find((item) => item.slug === slug)?.title.ru ?? slug;
  const selectedProduct = product || products[0]?.slug || "";

  async function handleGrant(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const { error } = await supabase
      .from("access_grants")
      .upsert({ email: email.trim().toLowerCase(), product_slug: selectedProduct, note: note.trim() });
    setIsSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    setEmail("");
    setNote("");
    setReloadKey((key) => key + 1);
  }

  async function handleRevoke(grant: Grant) {
    if (!window.confirm(`Отозвать доступ «${titleOf(grant.product_slug)}» у ${grant.email}?`)) return;
    const { error } = await supabase
      .from("access_grants")
      .delete()
      .eq("email", grant.email)
      .eq("product_slug", grant.product_slug);
    if (error) setError(error.message);
    else setReloadKey((key) => key + 1);
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Доступы</h1>
      <p className="mt-2 text-sm text-muted">
        Откройте платный материал без оплаты: человек входит на сайте с этим email (по коду из письма) и сразу
        получает доступ. Действует сразу, пересборка сайта не нужна.
      </p>

      <form onSubmit={handleGrant} className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Материал">
          <select value={selectedProduct} onChange={(event) => setProduct(event.target.value)} className={inputClass}>
            {products.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title.ru}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Заметка" hint="Для себя: кому и почему, например «клиентка, подарок»">
            <input value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSaving || !selectedProduct}>
            Открыть доступ
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <ErrorMessage message={error} />
      </div>

      {grants.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Пока никому не открыт доступ вручную.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
          {grants.map((grant) => (
            <li key={`${grant.email}-${grant.product_slug}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{grant.email}</p>
                <p className="text-xs text-muted">
                  {[titleOf(grant.product_slug), grant.note, new Date(grant.created_at).toLocaleDateString("ru")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button variant="danger" onClick={() => handleRevoke(grant)}>
                Отозвать
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
