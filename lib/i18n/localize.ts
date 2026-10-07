import type {
  CategoryWithDetails,
  Locale,
  ProductImage,
  ProductWithDetails,
} from '@/lib/types/database';

type Translated = { translations: Partial<Record<Locale, { name: string; description?: string | null }>> };

/** Current locale first, then English, then any translation that exists. */
function pick(entity: Translated, locale: Locale) {
  const t = entity.translations;
  return t[locale] ?? t.en ?? t.fr ?? t.ar;
}

export function localizedName(entity: Translated, locale: Locale, fallback = ''): string {
  return pick(entity, locale)?.name || fallback;
}

export function localizedDescription(entity: Translated, locale: Locale): string {
  const t = entity.translations;
  return t[locale]?.description || t.en?.description || '';
}

export function categoryName(category: CategoryWithDetails, locale: Locale): string {
  return localizedName(category, locale, category.slug);
}

/** Primary image first, then by the merchandiser's sort order. */
export function sortImages<T extends Pick<ProductImage, 'is_primary' | 'sort_order'>>(images: T[]): T[] {
  return [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
}

export function primaryImage(product: Pick<ProductWithDetails, 'images'>): ProductImage | undefined {
  return sortImages(product.images)[0];
}

/** Every name/description in every locale, lowercased — for cross-language search. */
export function searchableText(product: ProductWithDetails): string {
  return Object.values(product.translations)
    .flatMap((t) => [t?.name, t?.description])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
