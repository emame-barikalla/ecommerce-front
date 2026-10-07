import type {
  CategoryTranslation,
  CategoryWithDetails,
  Locale,
  ProductImage,
  ProductTranslation,
  ProductWithDetails,
} from '@/lib/types/database';

/** One select shape for every storefront product read (server and browser). */
export const PRODUCT_SELECT = `
  *,
  category:categories(*, translations:category_translations(*)),
  translations:product_translations(*),
  images:product_images(*)
`;

type Row = Record<string, unknown>;

function byLocale<T extends { locale: Locale }>(rows: unknown): Partial<Record<Locale, T>> {
  const out: Partial<Record<Locale, T>> = {};
  for (const row of (rows as T[] | null) ?? []) out[row.locale] = row;
  return out;
}

export function mapCategory(row: Row): CategoryWithDetails {
  const { translations, ...rest } = row;
  return {
    ...(rest as unknown as Omit<CategoryWithDetails, 'translations'>),
    translations: byLocale<CategoryTranslation>(translations),
  };
}

export function mapProduct(row: Row): ProductWithDetails {
  const { translations, images, category, ...rest } = row;
  return {
    ...(rest as unknown as Omit<ProductWithDetails, 'translations' | 'images' | 'category'>),
    // DECIMAL columns arrive as strings from PostgREST in some setups.
    price: Number(rest.price),
    compare_at_price: rest.compare_at_price == null ? null : Number(rest.compare_at_price),
    translations: byLocale<ProductTranslation>(translations),
    images: ((images as ProductImage[] | null) ?? []).slice(),
    category: category ? mapCategory(category as Row) : undefined,
  };
}
