import Link from 'next/link';
import { getImageProps } from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';

export const HERO_IMAGE = '/assets/brand/hero-still-life-desktop.jpg';

/**
 * Light, editorial hero. Art direction through <picture>: phones get the
 * portrait still life, tablets and up the wide shot, and each device
 * downloads only its own file.
 *
 * - Phones and tablets: stacked. The photo has a fixed height (so the copy
 *   never lands on the products) and fades into a tint sampled from the wall.
 * - lg and up: the copy sits over the empty wall beside the products. The
 *   wide photo leaves too little empty wall below lg, which is why tablets
 *   stack too. Under RTL the photo is mirrored so that wall stays behind the
 *   copy; only at this size, so the perfume label reads correctly elsewhere.
 *
 * The photo stays light in dark mode (it is merely dimmed), so the copy uses
 * the fixed `hero-*` colours rather than theme tokens. The section has a
 * min-height, not a fixed height: it grows with its copy, so the longer Arabic
 * headline can never push the badge out of view.
 */
export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations('home');

  const common = { alt: '', priority: true, quality: 85 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: HERO_IMAGE, width: 1376, height: 768, sizes: '100vw' });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({
    ...common,
    src: '/assets/brand/hero-still-life-mobile.jpg',
    width: 848,
    height: 1264,
    sizes: '100vw',
  });

  return (
    <section className="relative isolate flex lg:min-h-[min(46rem,calc(100svh-var(--header-h)-var(--announcement-h)-3rem))] overflow-hidden bg-hero-tint">
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop} sizes="100vw" />
        <source srcSet={mobile} sizes="100vw" />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative; alt="" comes from getImageProps */}
        <img
          {...img}
          className="absolute inset-x-0 top-0 -z-10 w-full h-[24rem] md:h-[28rem] lg:h-full object-cover object-[50%_40%] md:object-right lg:rtl:-scale-x-100 dark:brightness-[0.94]"
        />
      </picture>

      {/* Stacked layout: the photo fades into the wall tint just below the
          products. lg: a soft side fade behind the copy, on the start side in
          either direction. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[19rem] md:top-[21rem] h-[5rem] md:h-[7rem] -z-10 bg-gradient-to-b from-transparent to-hero-tint lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden lg:block bg-gradient-to-r rtl:bg-gradient-to-l from-hero-tint/80 from-10% via-hero-tint/40 via-35% to-transparent to-55%"
      />

      <div className="container-page flex items-end lg:items-center w-full pt-[22rem] md:pt-[26rem] pb-10 lg:py-20">
        <div className="w-full max-w-xl animate-rise">
          <p className="inline-flex max-w-full items-center gap-2 mb-5 rounded-full border border-hero-accent/20 bg-white/55 backdrop-blur-sm px-4 py-1.5 text-small font-medium leading-relaxed text-hero-accent whitespace-normal">
            <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 rounded-full bg-hero-accent" />
            {t('hero.badge')}
          </p>
          <h1 className="t-display text-hero-ink">{t('hero.title')}</h1>
          <p className="mt-5 text-base md:text-lg text-hero-muted max-w-lg leading-relaxed">{t('hero.subtitle')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'onLight', size: 'lg' })}>
              {t('hero.cta')}
              <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            </Link>
            <Link href={`/${locale}/why-choose-us`} className={buttonStyles({ variant: 'outlineOnLight', size: 'lg' })}>
              {t('hero.learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
