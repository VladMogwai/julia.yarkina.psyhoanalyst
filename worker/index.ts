/**
 * Cloudflare Worker in front of the static site. It serves `out/` as before and adds the only
 * server-side part of the site: paying for "Self-knowledge" content with WayForPay.
 *
 *   POST /api/checkout            signed-in buyer → a signed WayForPay payment form
 *   POST /api/wayforpay/callback  WayForPay → marks the order and grants (or revokes) access
 *   *    /api/wayforpay/return    WayForPay sends the buyer back → redirect to the thank-you page
 *
 * Secrets (Cloudflare dashboard → Worker → Settings → Variables and secrets):
 *   SUPABASE_SECRET_KEY, WAYFORPAY_MERCHANT_ACCOUNT, WAYFORPAY_SECRET_KEY
 */
import { createHmac, timingSafeEqual } from "node:crypto";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  SITE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string;
  WAYFORPAY_MERCHANT_ACCOUNT: string;
  WAYFORPAY_SECRET_KEY: string;
  /** The domain registered with WayForPay, e.g. yarkina-psy.online. */
  WAYFORPAY_DOMAIN: string;
}

interface Product {
  slug: string;
  title: Record<string, string>;
  price_uah: string;
  price_eur: string;
}

interface Order {
  reference: string;
  user_id: string;
  product_slug: string;
  amount: string;
  currency: string;
  status: string;
}

/** Languages of the site and the questionnaire; Ukrainian and Russian pay in hryvnias, the rest in euros. */
const LOCALES = ["uk", "ru", "fr", "en", "ro"] as const;
type Locale = (typeof LOCALES)[number];
const currencyFor = (locale: Locale) => (locale === "uk" || locale === "ru" ? "UAH" : "EUR");
/** Languages of the WayForPay payment page. */
const paymentLanguage = (locale: Locale) => (locale === "uk" ? "UA" : locale === "ru" ? "RU" : "EN");
/** Pages of the main site (it has no English or Romanian); the questionnaire keeps all five. */
const siteLocale = (locale: Locale) => (locale === "uk" || locale === "ru" ? locale : "fr");

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/checkout" && request.method === "OPTIONS") return cors(request, env, new Response(null));
      if (pathname === "/api/checkout" && request.method === "POST") return cors(request, env, await checkout(request, env));
      if (pathname === "/api/wayforpay/callback" && request.method === "POST") return await callback(request, env);
      if (pathname === "/api/wayforpay/return") return paymentReturn(request, env);
      if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: "server_error" }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;

// Checkout ---------------------------------------------------------------------

async function checkout(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { product?: string; locale?: string };
  const locale = LOCALES.find((code) => code === body.locale) ?? "uk";
  const [product] = await rest<Product[]>(
    env,
    `products?slug=eq.${encodeURIComponent(body.product ?? "")}&is_active=eq.true&select=slug,title,price_uah,price_eur`,
  );
  if (!product) return json({ error: "unknown_product" }, 404);

  const [bought, granted] = await Promise.all([
    rest<unknown[]>(env, `purchases?user_id=eq.${user.id}&product_slug=eq.${product.slug}&select=product_slug`),
    rest<unknown[]>(
      env,
      `access_grants?email=eq.${encodeURIComponent((user.email ?? "").toLowerCase())}&product_slug=eq.${product.slug}&select=product_slug`,
    ),
  ]);
  if (bought.length || granted.length) return json({ error: "already_owned" }, 409);

  const currency = currencyFor(locale);
  const amount = formatAmount(currency === "UAH" ? product.price_uah : product.price_eur);
  const reference = `${product.slug}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await rest(env, "orders", {
    method: "POST",
    body: { reference, user_id: user.id, product_slug: product.slug, amount, currency },
  });

  const productName = product.title[locale] ?? product.title.uk;
  const orderDate = String(Math.floor(Date.now() / 1000));
  const signed = [env.WAYFORPAY_MERCHANT_ACCOUNT, env.WAYFORPAY_DOMAIN, reference, orderDate, amount, currency, productName, "1", amount];
  const returnUrl = new URL("/api/wayforpay/return", env.SITE_URL);
  returnUrl.searchParams.set("order", reference);
  returnUrl.searchParams.set("locale", locale);

  return json({
    action: "https://secure.wayforpay.com/pay",
    fields: {
      merchantAccount: env.WAYFORPAY_MERCHANT_ACCOUNT,
      merchantAuthType: "SimpleSignature",
      merchantDomainName: env.WAYFORPAY_DOMAIN,
      merchantTransactionSecureType: "AUTO",
      merchantSignature: sign(env, signed),
      orderReference: reference,
      orderDate,
      amount,
      currency,
      "productName[]": productName,
      "productCount[]": "1",
      "productPrice[]": amount,
      clientEmail: user.email ?? "",
      language: paymentLanguage(locale),
      returnUrl: returnUrl.toString(),
      serviceUrl: new URL("/api/wayforpay/callback", env.SITE_URL).toString(),
    },
  });
}

// Callback from WayForPay --------------------------------------------------------

interface CallbackBody {
  merchantAccount: string;
  orderReference: string;
  merchantSignature: string;
  amount: number | string;
  currency: string;
  authCode?: string;
  cardPan?: string;
  transactionStatus: string;
  reasonCode?: number | string;
}

async function callback(request: Request, env: Env): Promise<Response> {
  const data = parseCallback(await request.text());
  if (!data?.orderReference) return json({ error: "bad_request" }, 400);

  const expected = sign(env, [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode ?? "",
    data.cardPan ?? "",
    data.transactionStatus,
    data.reasonCode ?? "",
  ]);
  if (!sameSignature(expected, data.merchantSignature) || data.merchantAccount !== env.WAYFORPAY_MERCHANT_ACCOUNT) {
    return json({ error: "bad_signature" }, 403);
  }

  const [order] = await rest<Order[]>(env, `orders?reference=eq.${encodeURIComponent(data.orderReference)}&select=*`);
  if (order) {
    const paidInFull = Number(data.amount) === Number(order.amount) && data.currency === order.currency;
    const status =
      data.transactionStatus === "Approved" && paidInFull
        ? "approved"
        : data.transactionStatus === "Refunded" || data.transactionStatus === "Voided"
          ? "refunded"
          : data.transactionStatus === "Expired"
            ? "expired"
            : data.transactionStatus === "Declined"
              ? "declined"
              : order.status;

    await rest(env, `orders?reference=eq.${encodeURIComponent(order.reference)}`, {
      method: "PATCH",
      body: { status, provider_payload: data, updated_at: new Date().toISOString() },
    });
    if (status === "approved") {
      // Repeated callbacks are harmless: the purchase is keyed by buyer and product.
      await rest(env, "purchases?on_conflict=user_id,product_slug", {
        method: "POST",
        body: { user_id: order.user_id, product_slug: order.product_slug, order_reference: order.reference },
        prefer: "resolution=ignore-duplicates",
      });
    }
    if (status === "refunded") {
      await rest(
        env,
        `purchases?user_id=eq.${order.user_id}&product_slug=eq.${order.product_slug}&order_reference=eq.${encodeURIComponent(order.reference)}`,
        { method: "DELETE" },
      );
    }
  }

  // WayForPay keeps retrying until it gets this signed "accept".
  const time = Math.floor(Date.now() / 1000);
  return json({
    orderReference: data.orderReference,
    status: "accept",
    time,
    signature: sign(env, [data.orderReference, "accept", time]),
  });
}

/** WayForPay posts the callback as a JSON body, sometimes wrapped as the only key of a form body. */
function parseCallback(text: string): CallbackBody | null {
  try {
    return JSON.parse(text) as CallbackBody;
  } catch {
    const [first] = [...new URLSearchParams(text).keys()];
    try {
      return first ? (JSON.parse(first) as CallbackBody) : null;
    } catch {
      return null;
    }
  }
}

// Return from WayForPay -----------------------------------------------------------

/** WayForPay sends the buyer back with a POST, which a static page cannot take; redirect to the site. */
function paymentReturn(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const locale = LOCALES.find((code) => code === url.searchParams.get("locale")) ?? "uk";
  const thanks = new URL(`/${siteLocale(locale)}/self-knowledge/thanks/`, env.SITE_URL);
  thanks.searchParams.set("order", url.searchParams.get("order") ?? "");
  return Response.redirect(thanks.toString(), 303);
}

// Helpers -----------------------------------------------------------------------------

function sign(env: Env, parts: (string | number)[]) {
  return createHmac("md5", env.WAYFORPAY_SECRET_KEY).update(parts.join(";"), "utf8").digest("hex");
}

function sameSignature(a: string, b: string | undefined) {
  if (!b || a.length !== b.length) return false;
  return timingSafeEqual(new TextEncoder().encode(a), new TextEncoder().encode(b));
}

/** "300.00" → "300", "7.50" → "7.5": the exact string that is signed and sent to WayForPay. */
function formatAmount(price: string) {
  return String(Number(price));
}

async function currentUser(request: Request, env: Env): Promise<{ id: string; email?: string } | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  return response.ok ? ((await response.json()) as { id: string; email?: string }) : null;
}

/** Supabase REST with the secret key: the Worker is the only writer of orders and purchases. */
async function rest<T = unknown>(
  env: Env,
  path: string,
  options: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=minimal",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) throw new Error(`Supabase ${options.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

/** The site calls /api/checkout from its own origin; local development runs the site on another port. */
function cors(request: Request, env: Env, response: Response) {
  const origin = request.headers.get("Origin");
  if (origin && (origin === new URL(env.SITE_URL).origin || /^http:\/\/localhost:\d+$/.test(origin))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  return response;
}
