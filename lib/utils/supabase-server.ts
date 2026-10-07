import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { STORE_ID } from '@/lib/config';
import { parseSettings, type StoreSettings } from '@/lib/store/settings-schema';
import { mapCategory, mapProduct, PRODUCT_SELECT } from '@/lib/utils/mappers';
import type { ProductWithDetails, CategoryWithDetails } from '@/lib/types/database';

// Server reads are wrapped in React `cache()` so the layout, footer, metadata
// and page share one query per request instead of each issuing their own.

export const getProductsServer = cache(async (limit?: number): Promise<ProductWithDetails[]> => {
  const supabase = createPublicClient();
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('[getProductsServer]', error.message);
    return [];
  }
  return (data ?? []).map(mapProduct);
});

export const getProductServer = cache(async (slug: string): Promise<ProductWithDetails | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) console.error('[getProductServer]', error.message);
  return data ? mapProduct(data) : null;
});

export const getCategoriesServer = cache(async (): Promise<CategoryWithDetails[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*, translations:category_translations(*)')
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getCategoriesServer]', error.message);
    return [];
  }
  return (data ?? []).map(mapCategory);
});

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('store_id', STORE_ID);

  if (error) console.error('[getStoreSettings]', error.message);
  return parseSettings(data ?? []);
});

/**
 * Products flagged `is_featured` in the CMS. Falls back to the merchandiser's
 * sort order when none are flagged — or when the `is_featured` column does not
 * exist yet because p1_catalog_fields.sql has not been run.
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithDetails[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (!error && data && data.length > 0) return data.map(mapProduct);
  return getProductsServer(limit);
}

export async function getNewArrivals(limit = 4, excludeIds: string[] = []): Promise<ProductWithDetails[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  // Avoid showing the same products twice on the homepage.
  if (excludeIds.length) query = query.not('id', 'in', `(${excludeIds.join(',')})`);

  const { data, error } = await query;
  if (error) {
    console.error('[getNewArrivals]', error.message);
    return [];
  }
  return (data ?? []).map(mapProduct);
}

/** Same-category products, fetched directly instead of filtering the whole catalog. */
export async function getRelatedProducts(product: ProductWithDetails, limit = 4) {
  if (!product.category_id) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('is_active', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[getRelatedProducts]', error.message);
    return [];
  }
  return (data ?? []).map(mapProduct);
}

export async function getSitemapEntries() {
  const supabase = createPublicClient();
  const [products, categories] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('store_id', STORE_ID).eq('is_active', true),
    supabase.from('categories').select('slug, updated_at').eq('store_id', STORE_ID).eq('is_active', true),
  ]);
  return { products: products.data ?? [], categories: categories.data ?? [] };
}
