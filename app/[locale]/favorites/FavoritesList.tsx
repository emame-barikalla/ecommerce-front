'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Heart } from 'lucide-react';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { getProductsByIds } from '@/lib/utils/supabase';
import type { Locale, ProductWithDetails } from '@/lib/types/database';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import EmptyState from '@/components/ui/EmptyState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

const noopSubscribe = () => () => {};

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14';

/**
 * Saved products. The wishlist is a list of ids kept on this device (no
 * account needed); products are read fresh so prices and stock are current.
 * Products that were withdrawn simply drop out of the list.
 */
export default function FavoritesList() {
  const t = useTranslations('wishlist');
  const tNav = useTranslations('nav');
  const locale = useLocale() as Locale;
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<ProductWithDetails[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // False during SSR and hydration, when the stored list is not readable yet —
  // fetching then would flash the empty state for a returning visitor.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const key = wishlist.join(',');

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setFailed(false);
    getProductsByIds(key ? key.split(',') : [])
      .then((rows) => !cancelled && setProducts(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // `key` captures the list content; refetching on a change is cheap.
  }, [hydrated, key, attempt]);

  // Keep the order in which items were saved, newest first.
  const ordered = products
    ? [...wishlist]
        .reverse()
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ProductWithDetails => !!p)
    : null;

  return (
    <div className="container-page pb-section">
      <div className="pt-6 pb-8 md:pt-8 md:pb-12">
        <Breadcrumb
          label={tNav('breadcrumb')}
          items={[{ label: tNav('home'), href: `/${locale}` }, { label: t('title') }]}
        />
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="t-h1">{t('title')}</h1>
            <p className="t-body mt-2">{t('subtitle')}</p>
          </div>
          {ordered && ordered.length > 0 && (
            <p className="text-small text-ink-secondary tabular shrink-0">{t('count', { count: ordered.length })}</p>
          )}
        </div>
      </div>

      {failed ? (
        <EmptyState
          icon={AlertCircle}
          title={t('errorTitle')}
          action={<Button onClick={() => setAttempt((a) => a + 1)}>{t('retry')}</Button>}
        />
      ) : ordered === null ? (
        <ProductGridSkeleton count={Math.min(Math.max(wishlist.length, 2), 8)} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="border border-line rounded-xl bg-surface-subtle"
          action={
            <Link href={`/${locale}/catalog`} className={buttonStyles()}>
              {t('browse')}
            </Link>
          }
        />
      ) : (
        <div className={GRID}>
          {ordered.map((product, i) => (
            <ProductCard key={product.id} product={product} locale={locale} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
