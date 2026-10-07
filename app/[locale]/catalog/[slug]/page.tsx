import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MessageCircle, RotateCcw, ShieldCheck, Tag, Truck, type LucideIcon } from 'lucide-react';
import {
  getProductServer,
  getRelatedProducts,
  getSitemapEntries,
  getStoreSettings,
} from '@/lib/utils/supabase-server';
import { categoryName, localizedDescription, localizedName, sortImages } from '@/lib/i18n/localize';
import { getTrustItems, type TrustKey } from '@/lib/store/trust';
import { hasDeliveryEstimate } from '@/lib/store/settings-schema';
import { SCHEMA_AVAILABILITY, breadcrumbJsonLd, jsonLdScript, localizedAlternates } from '@/lib/seo';
import { CURRENCY, SITE_URL } from '@/lib/config';
import type { Locale } from '@/lib/types/database';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Price, { formatPrice } from '@/components/ui/Price';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import RecentlyViewed from '@/components/sections/RecentlyViewed';
import ProductActions from './ProductActions';
import ProductGallery from './ProductGallery';
import ProductViewTracker from './ProductViewTracker';

type Params = { params: { locale: string; slug: string } };

/**
 * Current products are prerendered at build; products added later render on
 * first visit and are then cached like the rest (ISR, see the locale layout).
 */
export async function generateStaticParams({ params: { locale } }: { params: { locale: string } }) {
  const { products } = await getSitemapEntries();
  return products.map((p) => ({ locale, slug: p.slug }));
}

export async function generateMetadata({ params: { locale, slug } }: Params): Promise<Metadata> {
  const product = await getProductServer(slug);
  if (!product) return {};

  const t = product.translations[locale as Locale] ?? product.translations.en;
  const name = localizedName(product, locale as Locale, slug);
  const description = t?.meta_description || localizedDescription(product, locale as Locale).slice(0, 160);
  const image = sortImages(product.images)[0];

  return {
    title: t?.meta_title || name,
    description: description || undefined,
    alternates: localizedAlternates(locale, `/catalog/${slug}`),
    openGraph: {
      type: 'website',
      locale,
      title: name,
      description: description || undefined,
      images: image ? [{ url: image.image_url, alt: image.alt_text || name }] : [],
    },
    twitter: { card: 'summary_large_image', title: name, description: description || undefined },
  };
}

const TRUST_ICONS: Record<TrustKey, LucideIcon> = {
  whatsapp: MessageCircle,
  delivery: Truck,
  deliveryConfirmed: Truck,
  freeDelivery: Tag,
  returns: RotateCcw,
  authentic: ShieldCheck,
};

export default async function ProductPage({ params: { locale, slug } }: Params) {
  setRequestLocale(locale);
  const lang = locale as Locale;

  const [t, tNav, tTrust, product, settings] = await Promise.all([
    getTranslations('catalog'),
    getTranslations('nav'),
    getTranslations('trust'),
    getProductServer(slug),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const name = localizedName(product, lang, slug);
  const description = localizedDescription(product, lang);
  const category = product.category ? categoryName(product.category, lang) : '';
  const trust = getTrustItems(settings, formatPrice);
  const url = `/${locale}/catalog/${product.slug}`;

  const crumbs = [
    { name: tNav('home'), path: `/${locale}` },
    { name: tNav('catalog'), path: `/${locale}/catalog` },
    ...(category && product.category
      ? [{ name: category, path: `/${locale}/catalog?category=${product.category.slug}` }]
      : []),
    { name },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: description || undefined,
      image: sortImages(product.images).map((i) => i.image_url),
      sku: product.slug,
      url: `${SITE_URL}${url}`,
      category: category || undefined,
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}${url}`,
        price: product.price.toFixed(2),
        priceCurrency: CURRENCY,
        // Only stated when the store has recorded it — never assumed.
        ...(product.availability ? { availability: SCHEMA_AVAILABILITY[product.availability] } : {}),
      },
    },
    breadcrumbJsonLd(crumbs),
  ];

  return (
    <div className="container-page pb-[6rem] lg:pb-0">
      <ProductViewTracker productId={product.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      <div className="py-5 md:py-6">
        <Breadcrumb
          label={tNav('breadcrumb')}
          items={crumbs.map((c) => ({ label: c.name, href: c.path }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24">
        <ProductGallery images={sortImages(product.images)} productName={name} />

        {/* Purchase column sticks alongside a long gallery on desktop */}
        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          {category && <p className="t-label mb-3">{category}</p>}
          <h1 className="t-h1">{name}</h1>
          <Price value={product.price} compareAt={product.compare_at_price} size="lg" className="mt-4" />

          {hasDeliveryEstimate(settings) && (
            <p className="mt-3 text-small text-ink-secondary">
              {t('deliveryEstimate', { min: settings.deliveryDaysMin, max: settings.deliveryDaysMax })}
            </p>
          )}

          <div className="mt-7 pt-7 border-t border-line">
            <ProductActions product={product} productUrl={`${SITE_URL}${url}`} />
          </div>

          {description && (
            <div className="mt-8 pt-7 border-t border-line">
              <p className="t-body whitespace-pre-line">{description}</p>
            </div>
          )}

          <ul className="mt-8 pt-7 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {trust.map((item) => {
              const Icon = TRUST_ICONS[item.key];
              return (
                <li key={item.key} className="flex items-start gap-3">
                  <Icon size={17} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-tertiary" />
                  <div>
                    <p className="text-small font-medium text-ink">{tTrust(`${item.key}.title`, item.values)}</p>
                    <p className="text-caption text-ink-secondary mt-0.5">{tTrust(`${item.key}.desc`, item.values)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-section md:pt-section-lg">
          <SectionHeading
            title={t('relatedProducts')}
            action={
              product.category
                ? { label: t('viewAll'), href: `/${locale}/catalog?category=${product.category.slug}` }
                : undefined
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={lang} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed locale={lang} excludeId={product.id} />
    </div>
  );
}
