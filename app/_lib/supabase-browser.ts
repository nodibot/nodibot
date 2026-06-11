"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase-env";

// Supabase client for Client Components (the login form). Shares the auth
// session via cookies with the server client.
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
