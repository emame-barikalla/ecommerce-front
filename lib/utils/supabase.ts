import { createClient } from '@/lib/supabase/client';
import { STORE_ID } from '@/lib/config';
import { mapCategory, mapProduct, PRODUCT_SELECT } from '@/lib/utils/mappers';
import type { ProductWithDetails, CategoryWithDetails } from '@/lib/types/database';

// Browser-side reads. They run as the anonymous role, so RLS only ever
// returns active rows; the `is_active` filters just make the intent explicit.
// Errors are thrown so callers can show a proper error state.

export async function getProducts(): Promise<ProductWithDetails[]> {
  const { data, error } = await createClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

export async function getCategories(): Promise<CategoryWithDetails[]> {
  const { data, error } = await createClient()
    .from('categories')
    .select('*, translations:category_translations(*)')
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCategory);
}

/** Current state of the given products — used to refresh a stored cart. */
export async function getProductsByIds(ids: string[]): Promise<ProductWithDetails[]> {
  if (ids.length === 0) return [];
  const { data, error } = await createClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .in('id', ids);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}
