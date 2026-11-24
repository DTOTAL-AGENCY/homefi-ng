import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@homefi/db';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Signed-in user's client (RLS applies). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient<Database>(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: CookieToSet[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component: middleware refreshes the session instead
        }
      },
    },
  });
}

/**
 * Service-role client for API routes and jobs. Bypasses RLS, so every caller
 * must check ownership itself (anon token hash or user id).
 */
export function supabaseAdmin() {
  return createClient<Database>(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function currentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function currentProfile() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from('profiles').select('*').eq('id', user.id).single();
  return data ? { ...data, email: user.email ?? data.email } : null;
}
