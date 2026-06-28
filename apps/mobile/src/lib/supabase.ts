import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { ENV, isConfigured } from './env';

/**
 * Supabase client. Auth is phone-OTP (Supabase Auth). The session (JWT) is
 * persisted in the OS keychain/keystore via expo-secure-store — never in plain
 * AsyncStorage. The anon key is RLS-protected and public-safe.
 *
 * SecureStore caps a single value at ~2KB, so we chunk large sessions across
 * keys transparently. The BFF is the only thing that ever sees the service role.
 */
const CHUNK_LIMIT = 1800;

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const head = await SecureStore.getItemAsync(key);
    if (head === null) return null;
    if (!head.startsWith('__chunks__:')) return head;
    const count = Number.parseInt(head.slice('__chunks__:'.length), 10);
    let value = '';
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      value += part;
    }
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_LIMIT) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_LIMIT);
    await SecureStore.setItemAsync(key, `__chunks__:${count}`);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_LIMIT, (i + 1) * CHUNK_LIMIT),
      );
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith('__chunks__:')) {
      const count = Number.parseInt(head.slice('__chunks__:'.length), 10);
      for (let i = 0; i < count; i += 1) {
        await SecureStore.deleteItemAsync(`${key}.${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase: SupabaseClient = createClient(
  // Fall back to harmless placeholders so the bundle builds in mock/dev mode;
  // real values come from EXPO_PUBLIC_* at build time.
  ENV.supabaseUrl || 'https://placeholder.supabase.co',
  ENV.supabaseAnonKey || 'public-anon-placeholder',
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // RN has no URL session to detect; deep-link auth is handled explicitly.
      detectSessionInUrl: false,
    },
  },
);

export const supabaseReady = isConfigured.supabase;

/** Current access token (JWT) for BFF Authorization headers, or null. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
