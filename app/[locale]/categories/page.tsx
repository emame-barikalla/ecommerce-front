import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoriesServer } from '@/lib/utils/supabase-server';
import { categoryName } from '@/lib/i18n/localize';
import { localizedAlternates } from '@/lib/seo';
import { CATEGORY_IMAGES, FALLBACK_CATEGORY_IMAGE } from '@/lib/store/category-images';
import type { Locale } from '@/lib/types/database';
import DepartmentTiles from '@/components/sections/DepartmentTiles';

type Params = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Params): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('categories'), alternates: localizedAlternates(locale, '/categories') };
}

/** The bottom navigation's "Categories" tab: departments first, then categories. */
export default async function CategoriesPage({ params: { locale } }: Params) {
  setRequestLocale(locale);
  const lang = locale as Locale;
  const [t, tNav, categories] = await Promise.all([
    getTranslations('departments'),
    getTranslations('nav'),
    getCategoriesServer(),
  ]);
  const Chevron = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="container-page pt-6 md:pt-10 pb-section">
      <h1 className="t-h1 mb-6 md:mb-10">{tNav('categories')}</h1>

      <DepartmentTiles locale={locale} />

      {categories.length > 0 && (
        <section className="mt-10 md:mt-14" aria-labelledby="all-categories">
          <h2 id="all-categories" className="t-label mb-4">
            {t('byCategory')}
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/${locale}/catalog?category=${cat.slug}`}
                  className="group flex items-center gap-4 p-2.5 pe-4 rounded-lg border border-line bg-surface hover:border-line-strong hover:shadow-sm transition-[border-color,box-shadow]"
                >
                  <span className="relative w-16 h-16 shrink-0 overflow-hidden rounded-md bg-surface-sunken">
                    <Image
                      src={cat.image_url || CATEGORY_IMAGES[cat.slug] || FALLBACK_CATEGORY_IMAGE}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex-1 text-body font-medium text-ink">{categoryName(cat, lang)}</span>
                  <Chevron
                    size={18}
                    aria-hidden="true"
                    className="text-ink-tertiary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${locale}/catalog`}
                className="flex items-center justify-center h-full min-h-[5.25rem] rounded-lg border border-dashed border-line-strong text-body font-medium text-brand hover:bg-brand-subtle transition-colors"
              >
                {tNav('shopAll')}
              </Link>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
