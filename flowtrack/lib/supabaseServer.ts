import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CookieOptions } from '@supabase/ssr';

export function createSupabaseServerClient(cookieStore: any): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  return createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore?.get?.(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => cookieStore?.set?.({ name, value, ...options }),
      remove: (name: string, options: CookieOptions) => cookieStore?.set?.({ name, value: '', ...options }),
    },
  });
}
