import Link from 'next/link';
import { getImageProps } from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';

export const HERO_IMAGE = '/assets/brand/hero-desktop.jpg';

/**
 * Light, editorial hero. Art direction through <picture>: phones get their
 * own crop (subject at the top, copy below on a tint sampled from the wall),
 * larger screens the wide shot, and each device downloads only its own file.
 * The photo is mirrored under RTL so its empty side always sits behind the
 * copy (it contains no text, so the mirror is invisible). It stays light in
 * dark mode, so the copy uses fixed colours rather than theme tokens.
 *
 * The section has a min-height, not a fixed height: it grows with its copy,
 * so the longer Arabic headline can never push the badge out of view.
 */
export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations('home');

  const common = { alt: '', priority: true, quality: 85 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: HERO_IMAGE, width: 1376, height: 768, sizes: '100vw' });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({ ...common, src: '/assets/brand/hero-mobile.jpg', width: 928, height: 568, sizes: '100vw' });

  return (
    <section className="relative isolate flex md:min-h-[min(46rem,calc(100svh-var(--header-h)-var(--announcement-h)-3rem))] overflow-hidden bg-hero-tint">
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop} sizes="100vw" />
        <source srcSet={mobile} sizes="100vw" />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative; alt="" comes from getImageProps */}
        <img
          {...img}
          className="absolute inset-x-0 top-0 -z-10 w-full h-[24rem] md:h-full object-cover object-top md:object-right rtl:-scale-x-100 dark:brightness-[0.94]"
        />
      </picture>

      {/* Mobile: the photo (fixed height, so the copy never lands on the
          subject) fades into the wall tint. Desktop: a soft side fade behind
          the copy, on the start side in either direction. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[17rem] h-[7rem] -z-10 bg-gradient-to-b from-transparent to-hero-tint md:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden md:block bg-gradient-to-r rtl:bg-gradient-to-l from-hero-tint/80 from-10% via-hero-tint/40 via-35% to-transparent to-55%"
      />

      <div className="container-page flex items-end md:items-center w-full pt-[22rem] pb-10 md:py-20">
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
