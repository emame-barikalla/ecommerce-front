import { createClient } from '@/lib/supabase/client';
import { IMAGE_BUCKET, LOCALES, STORE_ID } from '@/lib/config';
import { mapCategory, mapProduct } from '@/lib/utils/mappers';
import { SETTING_KEYS, type StoreSettings } from '@/lib/store/settings-schema';
import type {
  Availability,
  CategoryWithDetails,
  Locale,
  ProductImage,
  ProductWithDetails,
} from '@/lib/types/database';

/**
 * Admin data layer. Runs in the browser with the signed-in admin's session,
 * so every write is still checked by RLS (`is_admin()`); nothing here bypasses
 * it. Errors are thrown as `AdminError` with a French, user-facing message;
 * the technical cause is logged to the console.
 */
export class AdminError extends Error {}

const supabase = () => createClient();

function fail(context: string, error: { message: string; code?: string } | null, userMessage: string): never {
  console.error(`[admin] ${context}`, error);
  if (error?.code === '42703') {
    // undefined_column: the p1_catalog_fields.sql migration has not run.
    throw new AdminError(
      'La base de données n’est pas à jour : exécutez supabase/p1_catalog_fields.sql dans Supabase, puis réessayez.'
    );
  }
  if (error?.code === '42501') throw new AdminError('Action refusée : ce compte n’a pas les droits administrateur.');
  throw new AdminError(userMessage);
}

/**
 * Purges the storefront cache (see app/api/revalidate) so a change shows on
 * the next visit. Best effort: the storefront also refreshes itself within 60 s.
 */
async function refreshStorefront() {
  try {
    const res = await fetch('/api/revalidate', { method: 'POST' });
    if (!res.ok) console.warn('[admin] storefront refresh failed', res.status);
  } catch (e) {
    console.warn('[admin] storefront refresh failed', e);
  }
}

// ------------------------------------------------------------------ slugs

/** URL-safe slug from any language: accents stripped, non-Latin text dropped. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function slugTaken(table: 'products' | 'categories', slug: string, exceptId?: string) {
  let query = supabase().from(table).select('id').eq('store_id', STORE_ID).eq('slug', slug).limit(1);
  if (exceptId) query = query.neq('id', exceptId);
  const { data, error } = await query;
  if (error) fail('slug check', error, 'Impossible de vérifier l’adresse (slug).');
  return (data ?? []).length > 0;
}

// --------------------------------------------------------------- storage

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return `« ${file.name} » n’est pas une image.`;
  if (file.size > MAX_IMAGE_BYTES) return `« ${file.name} » dépasse 5 Mo.`;
  return null;
}

async function uploadFile(folder: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase().storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) fail('upload', error, `Échec de l’envoi de « ${file.name} ».`);
  return supabase().storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best effort: a leftover file costs storage, not correctness. */
async function removeStoredFile(publicUrl: string) {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  const { error } = await supabase().storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.warn('[admin] storage cleanup failed', error);
}

// -------------------------------------------------------------- products

const ADMIN_PRODUCT_SELECT = `
  *,
  category:categories(*, translations:category_translations(*)),
  translations:product_translations(*),
  images:product_images(*)
`;

export async function listProducts(): Promise<ProductWithDetails[]> {
  const { data, error } = await supabase()
    .from('products')
    .select(ADMIN_PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) fail('listProducts', error, 'Impossible de charger les produits.');
  return (data ?? []).map(mapProduct);
}

export async function getProduct(id: string): Promise<ProductWithDetails | null> {
  const { data, error } = await supabase()
    .from('products')
    .select(ADMIN_PRODUCT_SELECT)
    .eq('store_id', STORE_ID)
    .eq('id', id)
    .maybeSingle();
  if (error) fail('getProduct', error, 'Impossible de charger le produit.');
  return data ? mapProduct(data) : null;
}

export interface ProductInput {
  slug: string;
  price: number;
  compareAtPrice: number | null;
  availability: Availability | null;
  categoryId: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  translations: Record<Locale, { name: string; description: string }>;
}

async function saveTranslations(productId: string, translations: ProductInput['translations']) {
  const filled = LOCALES.filter((l) => translations[l].name.trim());
  const cleared = LOCALES.filter((l) => !translations[l].name.trim());

  if (filled.length) {
    const { error } = await supabase()
      .from('product_translations')
      .upsert(
        filled.map((locale) => ({
          product_id: productId,
          locale,
          name: translations[locale].name.trim(),
          description: translations[locale].description.trim() || null,
        })),
        { onConflict: 'product_id,locale' }
      );
    if (error) fail('saveTranslations', error, 'Impossible d’enregistrer les traductions.');
  }
  if (cleared.length) {
    // A language whose name was emptied is removed, so the storefront falls
    // back to another language instead of showing a blank title.
    const { error } = await supabase()
      .from('product_translations')
      .delete()
      .eq('product_id', productId)
      .in('locale', cleared);
    if (error) fail('clearTranslations', error, 'Impossible de supprimer une traduction vide.');
  }
}

/** Creates or updates a product with its translations. Returns its id. */
export async function saveProduct(input: ProductInput, id?: string): Promise<string> {
  if (await slugTaken('products', input.slug, id)) {
    throw new AdminError(`L’adresse « ${input.slug} » est déjà utilisée par un autre produit.`);
  }

  const row = {
    slug: input.slug,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    availability: input.availability,
    category_id: input.categoryId,
    sort_order: input.sortOrder,
    is_featured: input.isFeatured,
    is_active: input.isActive,
  };

  if (id) {
    const { error } = await supabase().from('products').update(row).eq('id', id);
    if (error) fail('updateProduct', error, 'Impossible d’enregistrer le produit.');
    await saveTranslations(id, input.translations);
    await refreshStorefront();
    return id;
  }

  const { data, error } = await supabase()
    .from('products')
    .insert({ ...row, store_id: STORE_ID })
    .select('id')
    .single();
  if (error || !data) fail('createProduct', error, 'Impossible de créer le produit.');

  try {
    await saveTranslations(data.id, input.translations);
  } catch (e) {
    // Undo the half-created product rather than leave one with no name.
    await supabase().from('products').delete().eq('id', data.id);
    throw e;
  }
  await refreshStorefront();
  return data.id;
}

/** Soft delete: the product leaves the storefront but keeps its history. */
export async function setProductActive(id: string, isActive: boolean) {
  const { error } = await supabase().from('products').update({ is_active: isActive }).eq('id', id);
  if (error) fail('setProductActive', error, 'Impossible de modifier le statut du produit.');
  await refreshStorefront();
}

export async function addProductImages(productId: string, files: File[], existing: ProductImage[]) {
  let nextOrder = existing.reduce((max, img) => Math.max(max, img.sort_order), -1) + 1;
  let needsPrimary = !existing.some((img) => img.is_primary);
  const failures: string[] = [];

  for (const file of files) {
    try {
      const url = await uploadFile(productId, file);
      const { error } = await supabase().from('product_images').insert({
        product_id: productId,
        image_url: url,
        sort_order: nextOrder++,
        is_primary: needsPrimary,
      });
      if (error) {
        await removeStoredFile(url);
        fail('insertImage', error, `Échec de l’enregistrement de « ${file.name} ».`);
      }
      needsPrimary = false;
    } catch (e) {
      failures.push(e instanceof Error ? e.message : file.name);
    }
  }
  await refreshStorefront();
  return failures;
}

export async function setPrimaryImage(productId: string, imageId: string) {
  const client = supabase();
  const { error: clearError } = await client
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);
  if (clearError) fail('clearPrimary', clearError, 'Impossible de changer l’image principale.');
  const { error } = await client.from('product_images').update({ is_primary: true }).eq('id', imageId);
  if (error) fail('setPrimary', error, 'Impossible de changer l’image principale.');
  await refreshStorefront();
}

/** Persists a new order: each image's `sort_order` becomes its index. */
export async function reorderImages(ordered: ProductImage[]) {
  const results = await Promise.all(
    ordered.map((img, index) =>
      supabase().from('product_images').update({ sort_order: index }).eq('id', img.id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) fail('reorderImages', failed.error, 'Impossible de réordonner les images.');
  await refreshStorefront();
}

export async function deleteImage(image: ProductImage, remaining: ProductImage[]) {
  const { error } = await supabase().from('product_images').delete().eq('id', image.id);
  if (error) fail('deleteImage', error, 'Impossible de supprimer l’image.');
  await removeStoredFile(image.image_url);
  // Never leave a product without a primary image while it still has images.
  if (image.is_primary && remaining.length > 0) await setPrimaryImage(image.product_id, remaining[0].id);
  else await refreshStorefront();
}

// ------------------------------------------------------------ categories

export async function listCategories(): Promise<CategoryWithDetails[]> {
  const { data, error } = await supabase()
    .from('categories')
    .select('*, translations:category_translations(*)')
    .eq('store_id', STORE_ID)
    .order('sort_order', { ascending: true });
  if (error) fail('listCategories', error, 'Impossible de charger les catégories.');
  return (data ?? []).map(mapCategory);
}

export interface CategoryInput {
  slug: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  translations: Record<Locale, { name: string; description: string }>;
}

export async function saveCategory(input: CategoryInput, id?: string): Promise<string> {
  if (await slugTaken('categories', input.slug, id)) {
    throw new AdminError(`L’adresse « ${input.slug} » est déjà utilisée par une autre catégorie.`);
  }
  const row = { slug: input.slug, sort_order: input.sortOrder, is_active: input.isActive, image_url: input.imageUrl };

  let categoryId = id;
  if (id) {
    const { error } = await supabase().from('categories').update(row).eq('id', id);
    if (error) fail('updateCategory', error, 'Impossible d’enregistrer la catégorie.');
  } else {
    const { data, error } = await supabase()
      .from('categories')
      .insert({ ...row, store_id: STORE_ID })
      .select('id')
      .single();
    if (error || !data) fail('createCategory', error, 'Impossible de créer la catégorie.');
    categoryId = data.id;
  }

  const filled = LOCALES.filter((l) => input.translations[l].name.trim());
  const { error } = await supabase()
    .from('category_translations')
    .upsert(
      filled.map((locale) => ({
        category_id: categoryId,
        locale,
        name: input.translations[locale].name.trim(),
        description: input.translations[locale].description.trim() || null,
      })),
      { onConflict: 'category_id,locale' }
    );
  if (error) {
    if (!id) await supabase().from('categories').delete().eq('id', categoryId as string);
    fail('saveCategoryTranslations', error, 'Impossible d’enregistrer les traductions de la catégorie.');
  }
  const cleared = LOCALES.filter((l) => !input.translations[l].name.trim());
  if (id && cleared.length) {
    await supabase().from('category_translations').delete().eq('category_id', id).in('locale', cleared);
  }
  await refreshStorefront();
  return categoryId as string;
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const { error } = await supabase().from('categories').update({ is_active: isActive }).eq('id', id);
  if (error) fail('setCategoryActive', error, 'Impossible de modifier le statut de la catégorie.');
  await refreshStorefront();
}

export async function uploadCategoryImage(file: File) {
  return uploadFile('categories', file);
}

// -------------------------------------------------------------- settings

export async function saveSettings(values: Record<keyof StoreSettings, string>) {
  const rows = (Object.keys(SETTING_KEYS) as Array<keyof StoreSettings>).map((field) => ({
    store_id: STORE_ID,
    key: SETTING_KEYS[field],
    value: values[field].trim(),
  }));
  const { error } = await supabase().from('settings').upsert(rows, { onConflict: 'store_id,key' });
  if (error) fail('saveSettings', error, 'Impossible d’enregistrer les réglages.');
  await refreshStorefront();
}

export async function loadRawSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase().from('settings').select('key, value').eq('store_id', STORE_ID);
  if (error) fail('loadSettings', error, 'Impossible de charger les réglages.');
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']));
}

// -------------------------------------------------------------- messages

export async function deleteContactMessage(id: string) {
  const { error } = await supabase().from('contact_messages').delete().eq('id', id);
  if (error) fail('deleteContactMessage', error, 'Impossible de supprimer le message.');
}
