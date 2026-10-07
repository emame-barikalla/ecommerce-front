'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Heart, Info, Mail, Sparkles } from 'lucide-react';
import { LOCALE_OPTIONS } from '@/lib/config';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import Drawer from './ui/Drawer';
import { ThemeSegmented } from './ThemeToggle';
import WithSearchParams, { localeHref } from './WithSearchParams';
import { WhatsAppGlyph } from './WhatsAppButton';
import { cn } from '@/lib/utils/cn';

/**
 * The "Account" tab. The store has no customer sign-in — favorites and the
 * cart are kept on the device — so this sheet gathers what an account page
 * would: favorites, language, appearance, help and WhatsApp contact.
 */
export default function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('account');
  const tNav = useTranslations('nav');
  const tw = useTranslations('wishlist');
  const tWa = useTranslations('whatsapp');
  const locale = useLocale();
  const pathname = usePathname();
  const { whatsappNumber } = useStoreSettings();
  const { wishlist } = useWishlist();
  const Chevron = locale === 'ar' ? ChevronLeft : ChevronRight;

  const links = [
    { href: `/${locale}/favorites`, label: tw('title'), Icon: Heart, meta: wishlist.length || null },
    { href: `/${locale}/why-choose-us`, label: tNav('whyUs'), Icon: Sparkles, meta: null },
    { href: `/${locale}/about`, label: tNav('about'), Icon: Info, meta: null },
    { href: `/${locale}/contact`, label: tNav('contact'), Icon: Mail, meta: null },
  ];

  return (
    <Drawer open={open} onClose={onClose} title={tNav('account')} closeLabel={tNav('closeMenu')} side="bottom">
      <div className="px-5 py-5 space-y-7">
        <p className="text-small text-ink-secondary rounded-md bg-brand-subtle px-4 py-3">{t('deviceNote')}</p>

        <ul className="-mx-2">
          {links.map(({ href, label, Icon, meta }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                aria-current={pathname === href ? 'page' : undefined}
                className="flex items-center gap-3.5 px-2 py-3 rounded-md text-body text-ink hover:bg-surface-sunken transition-colors"
              >
                <span className="grid place-items-center w-9 h-9 rounded-full bg-surface-sunken text-ink-secondary">
                  <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="flex-1">{label}</span>
                {meta !== null && <span className="text-small text-ink-tertiary tabular">{meta}</span>}
                <Chevron size={16} aria-hidden="true" className="text-ink-tertiary" />
              </Link>
            </li>
          ))}
        </ul>

        <section>
          <h3 className="t-label mb-3">{tNav('language')}</h3>
          <WithSearchParams
            render={(params) => (
              <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-surface-sunken">
                {LOCALE_OPTIONS.map((l) => (
                  <Link
                    key={l.code}
                    href={localeHref(pathname, params, l.code)}
                    hrefLang={l.code}
                    lang={l.code}
                    onClick={onClose}
                    aria-current={locale === l.code ? 'true' : undefined}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 h-10 rounded-sm text-small transition-colors',
                      locale === l.code ? 'bg-surface text-ink shadow-xs font-medium' : 'text-ink-secondary hover:text-ink'
                    )}
                  >
                    {locale === l.code && <Check size={14} aria-hidden="true" className="text-brand" />}
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          />
        </section>

        <section>
          <h3 className="t-label mb-3">{t('appearance')}</h3>
          <ThemeSegmented />
        </section>

        {whatsappNumber && (
          <a
            href={buildWhatsAppUrl(whatsappNumber, tWa('defaultMessage'))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 h-12 rounded-md bg-whatsapp text-white font-medium hover:bg-whatsapp-hover transition-colors"
          >
            <WhatsAppGlyph size={19} />
            {tWa('contactUs')}
          </a>
        )}
      </div>
    </Drawer>
  );
}
