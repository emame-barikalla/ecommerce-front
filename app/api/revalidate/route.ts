import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Purges the storefront's ISR cache after an admin change, so products,
 * categories and settings show up on the next visit instead of after the
 * 60 s window. It also clears pages cached as 404 while a product was
 * archived: time-based revalidation re-renders them but keeps the 404 status.
 *
 * Admin only — the session cookie is checked against `is_admin()`.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Every storefront page sits under this layout; the admin has its own root.
  revalidatePath('/[locale]', 'layout');
  return NextResponse.json({ revalidated: true });
}
