'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, PackageSearch, SearchX, SlidersHorizontal } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/utils/supabase';
import { categoryName, localizedDescription, localizedName, searchableText } from '@/lib/i18n/localize';
import type { ProductWithDetails, CategoryWithDetails, Locale } from '@/lib/types/database';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import CategoryFilter from '@/components/commerce/CategoryFilter';
import SortSelect, { isSortOption, type SortOption } from '@/components/commerce/SortSelect';
import FilterSheet from '@/components/commerce/FilterSheet';

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14';

function CatalogContent() {
  const t = useTranslations('catalog');
  const tNav = useTranslations('nav');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state lives in the URL so views are linkable, survive a language
  // switch, and restore correctly on back/forward.
  const selectedCategory = searchParams.get('category') ?? 'all';
  const query = searchParams.get('q') ?? '';
  const sortParam = searchParams.get('sort');
  const sort: SortOption = isSortOption(sortParam) ? sortParam : 'featured';

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === 'all' || value === 'featured') next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load catalog:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category?.slug !== selectedCategory) return false;
      // Every language is searched: a French term finds the product on /en too.
      return !needle || searchableText(p).includes(needle);
    });

    const byName = (p: ProductWithDetails) => localizedName(p, locale);

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return byName(a).localeCompare(byName(b), locale);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'featured':
        default:
          // `sort_order` is the merchandiser's ordering from the CMS.
          return a.sort_order - b.sort_order;
      }
    });
  }, [products, selectedCategory, query, sort, locale]);

  const hasActiveFilters = selectedCategory !== 'all' || query !== '';
  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const title = query
    ? t('resultsFor', { query })
    : activeCategory
      ? categoryName(activeCategory, locale)
      : t('title');
  const subtitle = activeCategory ? localizedDescription(activeCategory, locale) || t('subtitle') : t('subtitle');

  const clearFilters = () => router.replace(pathname, { scroll: false });

  return (
    <div className="container-page">
      <div className="pt-6 pb-8 md:pt-8 md:pb-12">
        <Breadcrumb
          label={tNav('breadcrumb')}
          items={[
            { label: tNav('home'), href: `/${locale}` },
            activeCategory
              ? { label: tNav('catalog'), href: `/${locale}/catalog` }
              : { label: tNav('catalog') },
            ...(activeCategory ? [{ label: categoryName(activeCategory, locale) }] : []),
          ]}
        />

        <div className="mt-5 max-w-2xl">
          <h1 className="t-h1">{title}</h1>
          <p className="t-body mt-2">{subtitle}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[13rem_1fr] gap-x-12 pb-section">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block" aria-label={t('filters')}>
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-8">
            <div>
              <h2 className="t-label mb-4">{t('filter')}</h2>
              <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onChange={(slug) => setParam('category', slug)}
                locale={locale}
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('clearFilters')}
              </Button>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar: count on the left, controls on the right */}
          <div className="flex items-center justify-between gap-4 pb-5 mb-8 border-b border-line">
            <p className="text-small text-ink-secondary tabular" aria-live="polite">
              {loading ? t('loading') : t('productCount', { count: visibleProducts.length })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setFilterOpen(true)}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                {t('filters')}
              </Button>
              <SortSelect
                value={sort}
                onChange={(next) => setParam('sort', next)}
                className="hidden lg:block h-9 py-0 text-small"
              />
            </div>
          </div>

          {/* Mobile category rail — keeps the primary filter one tap away */}
          <div className="lg:hidden mb-8">
            <CategoryFilter
              layout="rail"
              categories={categories}
              selected={selectedCategory}
              onChange={(slug) => setParam('category', slug)}
              locale={locale}
            />
          </div>

          {loading ? (
            <ProductGridSkeleton />
          ) : failed ? (
            <EmptyState
              icon={AlertCircle}
              title={t('errorTitle')}
              description={t('errorDescription')}
              action={<Button onClick={load}>{t('retry')}</Button>}
            />
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              icon={hasActiveFilters ? SearchX : PackageSearch}
              title={hasActiveFilters ? t('noResultsTitle') : t('noProducts')}
              description={hasActiveFilters ? t('noResultsDescription') : t('noProductsDescription')}
              action={
                hasActiveFilters ? (
                  <Button onClick={clearFilters}>{t('browseAll')}</Button>
                ) : undefined
              }
            />
          ) : (
            <div className={GRID}>
              {visibleProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  priority={i < 4}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 22vw"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(slug) => setParam('category', slug)}
        sort={sort}
        onSortChange={(next) => setParam('sort', next)}
        locale={locale}
        resultCount={visibleProducts.length}
      />
    </div>
  );
}

function CatalogFallback() {
  return (
    <div className="container-page py-12">
      <ProductGridSkeleton />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}
