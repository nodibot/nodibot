// Supabase connection values, using the current Supabase key naming:
// "publishable" (public/browser) and "secret" (server-only).
// NEXT_PUBLIC_* literals are referenced directly so the bundler inlines them.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Public client key (browser/anon-equivalent).
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Server-only secret key (bypasses RLS). Never exposed to the client.
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";
