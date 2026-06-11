import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase-env";

// Cookie-aware Supabase client for Server Components, Server Actions and Route
// Handlers. Reads the admin's auth session from cookies so RLS "authenticated"
// policies apply. Use this (not the anon getSupabase()) for any admin access.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

// Returns the currently authenticated admin user, or null.
export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
