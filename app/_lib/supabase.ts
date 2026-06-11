import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase-env";

// Server-side Supabase client using the public (anon/publishable) key. All
// Phase 1 access (reads, inquiry inserts, view-count rpc) is governed by
// Row-Level Security, so this key never grants more than RLS allows.
//
// The secret/service-role key is intentionally NOT wired up here — it is used
// only by the seed script and must never reach the client bundle.

function required(name: string, value: string): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in .env.local (see .env.example).`,
    );
  }
  return value;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = required("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  const key = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", SUPABASE_PUBLISHABLE_KEY);
  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
