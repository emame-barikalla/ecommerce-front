import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { getStoreSettings } from '@/lib/utils/supabase-server';
import { localizedAlternates } from '@/lib/seo';

type Params = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Params): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: localizedAlternates(locale, '/about'),
  };
}

const VALUE_KEYS = ['mission', 'values', 'promise'] as const;
const HIGHLIGHT_KEYS = ['sourcing', 'shipping', 'support', 'authentic'] as const;

export default async function AboutPage({ params: { locale } }: Params) {
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations('about'), getStoreSettings()]);
  // The authenticity guarantee is a commitment — listed only once it is set.
  const highlights = HIGHLIGHT_KEYS.filter((key) => key !== 'authentic' || settings.authenticityGuarantee);

  return (
    <>
      <header className="container-page pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-2xl">
          <p className="t-label mb-5">{t('eyebrow')}</p>
          <h1 className="t-h1">{t('title')}</h1>
          <p className="t-body mt-5 text-base">{t('description')}</p>
        </div>
      </header>

      <section className="container-page grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className="relative aspect-editorial rounded-lg overflow-hidden bg-surface-sunken">
          <Image
            src="/assets/about-image.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div>
          <h2 className="t-h2">{t('story.title')}</h2>
          <p className="t-body mt-5">{t('story.paragraph1')}</p>
          <p className="t-body mt-4">{t('story.paragraph2')}</p>

          <ul className="mt-9 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {highlights.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-small text-ink">
                <Check size={15} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
                {t(`highlights.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page pt-section md:pt-section-lg">
        <SectionHeading title={t('valuesTitle')} align="center" />
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-12 max-w-5xl mx-auto">
          {VALUE_KEYS.map((key, i) => (
            <div key={key}>
              <p className="t-label mb-4">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="t-h3">{t(`${key}.title`)}</h3>
              <p className="t-small mt-3">{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pt-section md:pt-section-lg">
        <div className="rounded-lg bg-surface-inverse px-8 py-14 md:px-16 md:py-20 text-center">
          <h2 className="t-h2 text-white max-w-xl mx-auto">{t('journey.title')}</h2>
          <p className="mt-5 text-body text-white/70 max-w-lg mx-auto leading-relaxed">
            {t('journey.description')}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'inverse' })}>
              {t('journey.browseCatalog')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className={buttonStyles({
                variant: 'outlineInverse',
              })}
            >
              {t('journey.getInTouch')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
