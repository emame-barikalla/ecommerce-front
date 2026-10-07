'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale, ProductWithDetails } from '@/lib/types/database';
import { getProductsByIds } from '@/lib/utils/supabase';
import ProductCard from '@/components/ProductCard';

// Only ids are stored; products are re-read so prices and availability are
// current and withdrawn products drop out on their own.
const STORAGE_KEY = 'recently_viewed_ids';
const MAX_STORED = 8;

function readIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(productId: string) {
  try {
    const next = [productId, ...readIds().filter((id) => id !== productId)].slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — the feature is not worth failing over.
  }
}

interface RecentlyViewedProps {
  locale: Locale;
  /** Hide a product from its own detail page. */
  excludeId?: string;
}

export default function RecentlyViewed({ locale, excludeId }: RecentlyViewedProps) {
  const t = useTranslations('recentlyViewed');
  const [products, setProducts] = useState<ProductWithDetails[]>([]);

  useEffect(() => {
    const ids = readIds().filter((id) => id !== excludeId).slice(0, 4);
    if (ids.length === 0) return;
    let cancelled = false;
    getProductsByIds(ids)
      .then((found) => {
        if (cancelled) return;
        // Keep the viewing order, which the `in` query does not preserve.
        const byId = new Map(found.map((p) => [p.id, p]));
        setProducts(ids.map((id) => byId.get(id)).filter((p): p is ProductWithDetails => !!p));
      })
      .catch(() => {
        // A secondary section — failing silently is the right call.
      });
    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed" className="container-page pt-section md:pt-section-lg">
      <h2 id="recently-viewed" className="t-h3 mb-8">
        {t('title')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    </section>
  );
}
