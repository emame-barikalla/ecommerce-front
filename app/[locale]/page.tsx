import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, PackageCheck } from 'lucide-react';
import {
  getCategoriesServer,
  getFeaturedProducts,
  getNewArrivals,
  getStoreSettings,
} from '@/lib/utils/supabase-server';
import { categoryName } from '@/lib/i18n/localize';
import { jsonLdScript, localizedAlternates } from '@/lib/seo';
import { SITE_URL } from '@/lib/config';
import type { Locale } from '@/lib/types/database';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import TrustStrip from '@/components/sections/TrustStrip';
import StoreStats from '@/components/sections/StoreStats';
import Newsletter from '@/components/sections/Newsletter';
import FAQ from '@/components/sections/FAQ';
import RecentlyViewed from '@/components/sections/RecentlyViewed';

type Params = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Params): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    // The layout template would append the store name to itself; use it as-is.
    title: { absolute: `${(await getStoreSettings()).storeName} — ${t('hero.title')}` },
    description: t('hero.subtitle'),
    alternates: localizedAlternates(locale),
    openGraph: { title: t('hero.title'), description: t('hero.subtitle'), locale, images: ['/assets/hero5.jpg'] },
  };
}

/** Editorial fallback per category slug until an image is set in the admin. */
const CATEGORY_IMAGES: Record<string, string> = {
  skincare: '/assets/skincare2.jpg',
  bags: '/assets/bags2.jpg',
  shoes: '/assets/shoes.jpg',
  makeup: '/assets/makeup.jpg',
};
const FALLBACK_CATEGORY_IMAGE = '/assets/about-image.jpg';

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14';

export default async function HomePage({ params: { locale } }: Params) {
  setRequestLocale(locale);
  const lang = locale as Locale;

  const [t, categories, featured, settings] = await Promise.all([
    getTranslations('home'),
    getCategoriesServer(),
    getFeaturedProducts(8),
    getStoreSettings(),
  ]);
  // Excludes what is already shown above, so the two rows never repeat.
  const newArrivals = await getNewArrivals(4, featured.map((p) => p.id));

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName,
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/assets/logo_shop.png`,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    sameAs: [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organization)} />

      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative">
        <div className="relative min-h-[30rem] h-[calc(100svh-var(--header-h)-var(--announcement-h)-4rem)] max-h-[44rem] overflow-hidden">
          <Image src="/assets/hero5.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          {/* Single soft scrim — enough contrast for AA text, no heavy overlay */}
          {/* Two scrims: a bottom fade for the CTA row and a side fade behind the
              text (mirrored under RTL), so copy stays legible on light photos. */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-ink/60 via-ink/20 to-transparent md:via-transparent"
          />

          <div className="relative h-full container-page flex items-end pb-12 md:pb-20">
            <div className="max-w-2xl animate-rise">
              <p className="t-label !text-white/80 mb-4">{t('hero.badge')}</p>
              <h1 className="t-display text-white">{t('hero.title')}</h1>
              <p className="mt-5 text-base md:text-lg text-white/90 max-w-lg leading-relaxed">{t('hero.subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'inverse', size: 'lg' })}>
                  {t('hero.cta')}
                  <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
                </Link>
                <Link
                  href={`/${locale}/why-choose-us`}
                  className={buttonStyles({
                    variant: 'outlineInverse',
                    size: 'lg',
                  })}
                >
                  {t('hero.learnMore')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip label={t('benefits.title')} className="container-page py-9 md:py-11 border-b border-line" />

      {/* ---------------------------------------------------------- CATEGORIES */}
      {categories.length > 0 && (
        <section className="container-page pt-section md:pt-section-lg">
          <SectionHeading
            eyebrow={t('categories.eyebrow')}
            title={t('categories.title')}
            action={{ label: t('categories.viewAll'), href: `/${locale}/catalog` }}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/catalog?category=${cat.slug}`}
                className="group relative block aspect-editorial overflow-hidden rounded-lg bg-surface-sunken"
              >
                <Image
                  src={cat.image_url || CATEGORY_IMAGES[cat.slug] || FALLBACK_CATEGORY_IMAGE}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <h3 className="text-white text-base font-medium">{categoryName(cat, lang)}</h3>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-caption text-white/85">
                    {t('categories.shopNow')}
                    <ArrowRight
                      size={12}
                      aria-hidden="true"
                      className="rtl:-scale-x-100 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ FEATURED */}
      <section className="container-page pt-section md:pt-section-lg">
        <SectionHeading
          eyebrow={t('bestSellers.eyebrow')}
          title={t('bestSellers.title')}
          action={{ label: t('bestSellers.viewAll'), href: `/${locale}/catalog` }}
        />
        {featured.length > 0 ? (
          <div className={GRID}>
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} locale={lang} priority={i < 2} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PackageCheck}
            title={t('bestSellers.emptyTitle')}
            description={t('bestSellers.emptyDescription')}
            className="border border-line rounded-lg"
          />
        )}
      </section>

      {/* --------------------------------------------------------------- PROMO */}
      <section className="container-page pt-section md:pt-section-lg">
        <div className="relative overflow-hidden rounded-lg bg-surface-inverse">
          <div className="grid md:grid-cols-2 items-stretch">
            <div className="relative min-h-[15rem] md:min-h-[24rem] order-first md:order-last">
              <Image src="/assets/hero4.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-7 md:p-14 lg:p-16">
              <p className="t-label !text-white/70 mb-4">{t('promo.badge')}</p>
              <h2 className="t-h2 text-white">{t('promo.title')}</h2>
              <p className="mt-4 text-body text-white/80 max-w-sm">{t('promo.description')}</p>
              <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'inverse', className: 'mt-8 self-start' })}>
                {t('promo.cta')}
                <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="container-page pt-section md:pt-section-lg">
          <SectionHeading
            eyebrow={t('newArrivals.eyebrow')}
            title={t('newArrivals.title')}
            action={{ label: t('newArrivals.viewAll'), href: `/${locale}/catalog?sort=newest` }}
          />
          <div className={GRID}>
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} locale={lang} />
            ))}
          </div>
        </section>
      )}

      <StoreStats className="container-page pt-section md:pt-section-lg" />

      <div className="pt-section md:pt-section-lg">
        <FAQ />
      </div>

      <RecentlyViewed locale={lang} />

      <div className="pt-section md:pt-section-lg">
        <Newsletter />
      </div>
    </>
  );
}
