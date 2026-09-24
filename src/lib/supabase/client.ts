import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null | undefined;

/**
 * Shared Supabase client. Returns null when the project is not configured yet,
 * so the site still builds (with empty content) before Supabase is set up.
 */
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    client = url && publishableKey ? createClient(url, publishableKey) : null;
  }
  return client;
}
