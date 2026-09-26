// Uploads paid content to Supabase: every supabase/seed/<product>/<locale>.json becomes one row of
// public.premium_content. The content never ships with the site; buyers read it from the database.
//
//   node --env-file=.env.local scripts/upload-premium-content.mjs questions-to-self
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";

const product = process.argv[2];
if (!product) throw new Error("Usage: upload-premium-content.mjs <product-slug>");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const directory = new URL(`../supabase/seed/${product}/`, import.meta.url);
const rows = readdirSync(directory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => ({
    product_slug: product,
    locale: file.replace(".json", ""),
    payload: JSON.parse(readFileSync(new URL(file, directory), "utf8")),
    updated_at: new Date().toISOString(),
  }));

const { error } = await supabase.from("premium_content").upsert(rows);
if (error) throw error;
console.log(`${product}: uploaded ${rows.map((row) => row.locale).join(", ")}`);
