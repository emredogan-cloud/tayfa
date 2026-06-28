import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from './env.js';

/**
 * Supabase server clients.
 *
 *  • `getServerSupabase()` — a cookie-bound client running as the SIGNED-IN user
 *    (anon key + the user's JWT from cookies). Used to read the auth session in
 *    Server Components / Route Handlers. RLS applies.
 *
 *  • `getServiceSupabase()` — the SERVICE ROLE client (god-mode, bypasses RLS).
 *    BFF + T&S console ONLY. Never returned to a browser. Most BFF data access
 *    goes through Drizzle (`lib/db.ts`); this is for Supabase-native surfaces
 *    (Auth admin, Storage) when needed.
 *
 * Returns `null` when Supabase env is absent so mock mode degrades gracefully
 * (no session) instead of throwing at import time.
 */

export async function getServerSupabase(): Promise<SupabaseClient | null> {
  const url = env.supabaseUrl();
  const anonKey = env.supabaseAnonKey();
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set({ name, value, ...(options ?? {}) });
          }
        } catch {
          // Called from a Server Component render — cookies are read-only there.
          // Session refresh is handled in middleware, so this is safe to ignore.
        }
      },
    },
  });
}

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  const url = env.supabaseUrl();
  const serviceKey = env.supabaseServiceRoleKey();
  if (!url || !serviceKey) return null;
  serviceClient ??= createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serviceClient;
}
