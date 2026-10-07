import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Facebook, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { getCategoriesServer, getStoreSettings } from '@/lib/utils/supabase-server';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import { categoryName } from '@/lib/i18n/localize';
import type { Locale } from '@/lib/types/database';
import { LOCALE_OPTIONS } from '@/lib/config';

function TikTokIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.8a5.7 5.7 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

export default async function Footer({ locale }: { locale: string }) {
  const lang = locale as Locale;
  const [t, nav, categories, settings] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getCategoriesServer(),
    getStoreSettings(),
  ]);

  // Only networks with a real URL entered in the admin are shown.
  const socials = [
    { href: settings.instagramUrl, label: t('followInstagram'), icon: <Instagram size={15} strokeWidth={1.6} aria-hidden="true" /> },
    { href: settings.facebookUrl, label: t('followFacebook'), icon: <Facebook size={15} strokeWidth={1.6} aria-hidden="true" /> },
    { href: settings.tiktokUrl, label: t('followTiktok'), icon: <TikTokIcon /> },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  const helpLinks = [
    { label: nav('whyUs'), href: `/${locale}/why-choose-us` },
    { label: nav('about'), href: `/${locale}/about` },
    { label: nav('contact'), href: `/${locale}/contact` },
    { label: t('trackOrder'), href: `/${locale}/orders/track` },
  ];

  const linkClass = 'text-ink-secondary hover:text-ink transition-colors';

  return (
    <footer className="mt-section-lg border-t border-line bg-subtle">
      <div className="container-page py-14 md:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="col-span-2 lg:col-span-4 max-w-sm">
            <Link href={`/${locale}`} className="font-display text-2xl leading-none text-ink">
              {settings.storeName}
            </Link>
            <p className="t-small mt-4">{t('tagline')}</p>

            <ul className="mt-6 space-y-2.5 text-small text-ink-secondary">
              <li className="flex items-center gap-2.5">
                <MapPin size={14} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-ink-tertiary" />
                <span>{t('location')}</span>
              </li>
              {settings.contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail size={14} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-ink-tertiary" />
                  <a href={`mailto:${settings.contactEmail}`} className={linkClass}>
                    <bdi>{settings.contactEmail}</bdi>
                  </a>
                </li>
              )}
              {settings.whatsappNumber && (
                <li className="flex items-center gap-2.5">
                  <MessageCircle size={14} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-ink-tertiary" />
                  <a
                    href={buildWhatsAppUrl(settings.whatsappNumber, t('whatsappGreeting'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {t('whatsappSupport')}
                  </a>
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <div className="flex items-center gap-2 mt-6">
                {socials.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="grid place-items-center w-11 h-11 rounded-md border border-line text-ink-secondary hover:border-ink hover:text-ink transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-labelledby="footer-shop" className="lg:col-span-3 lg:col-start-6">
            <h2 id="footer-shop" className="t-label mb-4">
              {nav('catalog')}
            </h2>
            <ul className="space-y-1 text-small">
              <li>
                <Link href={`/${locale}/catalog`} className={`${linkClass} inline-block py-1.5`}>
                  {t('allProducts')}
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/${locale}/catalog?category=${cat.slug}`} className={`${linkClass} inline-block py-1.5`}>
                    {categoryName(cat, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-help" className="lg:col-span-2">
            <h2 id="footer-help" className="t-label mb-4">
              {t('help')}
            </h2>
            <ul className="space-y-1 text-small">
              {helpLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`${linkClass} inline-block py-1.5`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-lang" className="lg:col-span-2">
            <h2 id="footer-lang" className="t-label mb-4">
              {t('language')}
            </h2>
            <ul className="space-y-1 text-small">
              {LOCALE_OPTIONS.map((l) => (
                <li key={l.code}>
                  <Link
                    href={`/${l.code}`}
                    hrefLang={l.code}
                    lang={l.code}
                    aria-current={l.code === locale ? 'true' : undefined}
                    className={`${linkClass} inline-block py-1.5 aria-[current]:text-ink aria-[current]:font-medium`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page py-6">
          <p className="text-caption text-ink-tertiary">
            © {new Date().getFullYear()} {settings.storeName}. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
