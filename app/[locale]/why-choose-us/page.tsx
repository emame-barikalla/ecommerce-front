import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Headphones, Star } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import TrustStrip from '@/components/sections/TrustStrip';
import StoreStats from '@/components/sections/StoreStats';
import { localizedAlternates } from '@/lib/seo';

type Params = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Params): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'whyChooseUs' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: tNav('whyUs'),
    description: t('subtitle'),
    alternates: localizedAlternates(locale, '/why-choose-us'),
  };
}

const FEATURES = [
  { key: 'premiumQuality', icon: Star },
  { key: 'support', icon: Headphones },
] as const;

const STEPS = ['browse', 'contact', 'confirm', 'receive'] as const;

export default async function WhyChooseUsPage({ params: { locale } }: Params) {
  setRequestLocale(locale);
  const [t, tNav] = await Promise.all([getTranslations('whyChooseUs'), getTranslations('nav')]);

  return (
    <>
      <header className="container-page pt-14 md:pt-24 pb-10 md:pb-14 border-b border-line">
        <div className="max-w-2xl">
          <p className="t-label mb-4">{t('eyebrow')}</p>
          <h1 className="t-h1">{tNav('whyUs')}</h1>
          <p className="t-body mt-5 text-base">{t('subtitle')}</p>
        </div>
      </header>

      <section className="container-page pt-section">
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-12 max-w-4xl">
          {FEATURES.map((feature) => (
            <article key={feature.key}>
              <feature.icon size={20} strokeWidth={1.5} aria-hidden="true" className="text-brand mb-4" />
              <h2 className="t-h3">{t(`features.${feature.key}.title`)}</h2>
              <p className="t-small mt-2.5">{t(`features.${feature.key}.description`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page pt-section md:pt-section-lg">
        <SectionHeading title={t('promisesTitle')} />
        <TrustStrip label={t('promisesTitle')} />
      </section>

      <section className="container-page pt-section md:pt-section-lg">
        <div className="rounded-lg bg-subtle border border-line px-6 py-12 md:px-14 md:py-16">
          <SectionHeading title={t('howItWorks.title')} align="center" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STEPS.map((key, i) => (
              <li key={key}>
                <p className="t-label mb-3">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-body font-medium text-ink">{t(`howItWorks.steps.${key}.title`)}</h3>
                <p className="t-small mt-1.5">{t(`howItWorks.steps.${key}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <StoreStats className="container-page pt-section md:pt-section-lg" />

      <section className="container-page pt-section md:pt-section-lg">
        <div className="border-t border-line pt-14 text-center">
          <h2 className="t-h2 max-w-xl mx-auto">{t('cta.title')}</h2>
          <p className="t-body mt-4 max-w-md mx-auto">{t('cta.description')}</p>
          <Link href={`/${locale}/catalog`} className={buttonStyles({ size: 'lg', className: 'mt-8' })}>
            {t('cta.button')}
            <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
          </Link>
        </div>
      </section>
    </>
  );
}
