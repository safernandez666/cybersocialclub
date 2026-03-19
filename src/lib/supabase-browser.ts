import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for browser usage (client components).
 * Uses the anon key — RLS policies apply.
 * NEVER import supabase-admin.ts from client components.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
