import { builtInCertificates } from "@/content/certificates";
import { getSupabase } from "@/lib/supabase/client";
import type { Certificate } from "@/lib/supabase/types";

/** Certificates shipped with the site, then the ones added in /admin. Runs at build time. */
export async function getCertificates(): Promise<Certificate[]> {
  const supabase = getSupabase();
  if (!supabase) return builtInCertificates;

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("sort_order")
    .order("year", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to load certificates: ${error.message}`);
  return [...builtInCertificates, ...(data as Certificate[])];
}
