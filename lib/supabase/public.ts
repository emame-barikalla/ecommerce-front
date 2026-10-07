import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Session-less client for public storefront reads on the server. It queries
 * as the anonymous role — exactly what a shopper sees under RLS — and, not
 * touching cookies, lets pages be statically rendered and revalidated (ISR)
 * instead of hitting the database on every request.
 *
 * Use `lib/supabase/server.ts` wherever the signed-in user matters (admin).
 */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
