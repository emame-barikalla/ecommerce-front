'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Check, Menu, Search, X } from 'lucide-react';
import type { CategoryWithDetails, Locale } from '@/lib/types/database';
import { categoryName } from '@/lib/i18n/localize';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { LOCALE_OPTIONS } from '@/lib/config';
import CartButton from './CartButton';
import SearchBar from './SearchBar';
import LanguageSwitcher from './LanguageSwitcher';
import WithSearchParams, { localeHref } from './WithSearchParams';
import Drawer from './ui/Drawer';
import { IconButton } from './ui/IconButton';
import { cn } from '@/lib/utils/cn';

/** Content pages live in the mobile menu and the footer, not the header. */
const INFO_LINKS = [
  { href: '/why-choose-us', label: 'whyUs' },
  { href: '/about', label: 'about' },
  { href: '/contact', label: 'contact' },
] as const;

/** Beyond this, categories stay one click away on the catalog page. */
const MAX_HEADER_CATEGORIES = 5;

interface NavLinkItem {
  key: string;
  href: string;
  label: string;
  active: boolean;
}

export default function Navbar({
  categories,
  onOpenCart,
}: {
  categories: CategoryWithDetails[];
  onOpenCart: () => void;
}) {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { storeName } = useStoreSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const onCatalog = pathname === `/${locale}/catalog`;

  /** The active category comes from `?category=`, read under Suspense. */
  const buildLinks = (params: URLSearchParams): NavLinkItem[] => {
    const active = onCatalog ? params.get('category') : null;
    return [
      { key: 'all', href: `/${locale}/catalog`, label: t('catalog'), active: onCatalog && !active },
      ...categories.map((cat) => ({
        key: cat.id,
        href: `/${locale}/catalog?category=${cat.slug}`,
        label: categoryName(cat, locale),
        active: active === cat.slug,
      })),
    ];
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-header bg-white/95 backdrop-blur-md',
          'transition-[border-color,box-shadow] duration-300',
          scrolled ? 'border-b border-line shadow-xs' : 'border-b border-transparent'
        )}
      >
        <nav aria-label={t('primary')} className="container-page">
          <div className="flex items-center gap-2 md:gap-4 h-header">
            <IconButton
              label={t('openMenu')}
              onClick={() => setMenuOpen(true)}
              className="lg:hidden -ms-2.5"
              aria-expanded={menuOpen}
            >
              <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
            </IconButton>

            <Link href={`/${locale}`} className="flex items-center gap-2.5 h-11 min-w-0 lg:shrink-0 lg:me-6">
              <Image src="/assets/logo_shop.svg" alt="" width={30} height={30} priority className="shrink-0 rounded-xs" />
              {/* dir=auto: a Latin store name truncates at its own end, even on /ar */}
              <span dir="auto" className="font-display text-lg leading-none tracking-[-0.01em] text-ink whitespace-nowrap truncate">
                {storeName}
              </span>
            </Link>

            <ul className="hidden lg:flex items-center gap-1 min-w-0">
              <WithSearchParams
                render={(params) =>
                  buildLinks(params)
                    .slice(0, MAX_HEADER_CATEGORIES + 1)
                    .map((link) => (
                      <li key={link.key}>
                        <Link
                          href={link.href}
                          aria-current={link.active ? 'page' : undefined}
                          className={cn(
                            'relative block px-3 py-2 text-sm whitespace-nowrap transition-colors',
                            link.active ? 'text-ink' : 'text-ink-secondary hover:text-ink'
                          )}
                        >
                          {link.label}
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute inset-x-3 -bottom-px h-px bg-ink transition-transform duration-200',
                              link.active ? 'scale-x-100' : 'scale-x-0'
                            )}
                          />
                        </Link>
                      </li>
                    ))
                }
              />
            </ul>

            <div className="flex-1" />

            <div className="hidden lg:block">
              <SearchBar variant="expand" />
            </div>

            <div className="flex items-center gap-0.5 -me-2.5 lg:me-0">
              <IconButton
                label={t('search')}
                onClick={() => setSearchOpen((o) => !o)}
                className="lg:hidden"
                aria-expanded={searchOpen}
              >
                {searchOpen ? (
                  <X size={19} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Search size={19} strokeWidth={1.75} aria-hidden="true" />
                )}
              </IconButton>

              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>

              <CartButton onClick={onOpenCart} />
            </div>
          </div>

          {searchOpen && (
            <div className="lg:hidden pb-3 animate-fade-in">
              <SearchBar autoFocus onSubmitted={() => setSearchOpen(false)} />
            </div>
          )}
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={closeMenu} title={t('menu')} closeLabel={t('closeMenu')} side="start">
        <WithSearchParams
          render={(params) => (
            <div className="py-2">
              <MenuSection title={t('categories')}>
                {buildLinks(params).map((link) => (
                  <MenuLink key={link.key} href={link.href} active={link.active} onClick={closeMenu}>
                    {link.label}
                  </MenuLink>
                ))}
              </MenuSection>

              <MenuSection title={t('information')}>
                {INFO_LINKS.map((link) => (
                  <MenuLink
                    key={link.href}
                    href={`/${locale}${link.href}`}
                    active={pathname === `/${locale}${link.href}`}
                    onClick={closeMenu}
                  >
                    {t(link.label)}
                  </MenuLink>
                ))}
              </MenuSection>

              <MenuSection title={t('language')}>
                {LOCALE_OPTIONS.map((l) => (
                  <li key={l.code}>
                    <Link
                      href={localeHref(pathname, params, l.code)}
                      hrefLang={l.code}
                      lang={l.code}
                      onClick={closeMenu}
                      aria-current={locale === l.code ? 'true' : undefined}
                      className="flex items-center justify-between px-5 py-3 text-body text-ink hover:bg-surface-subtle transition-colors"
                    >
                      {l.label}
                      {locale === l.code && <Check size={16} aria-hidden="true" className="text-brand" />}
                    </Link>
                  </li>
                ))}
              </MenuSection>
            </div>
          )}
        />
      </Drawer>
    </>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-3 border-b border-line last:border-b-0">
      <h3 className="t-label px-5 mb-1">{title}</h3>
      <ul>{children}</ul>
    </section>
  );
}

function MenuLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'block px-5 py-3 text-body text-ink transition-colors hover:bg-surface-subtle',
          active && 'font-medium'
        )}
      >
        {children}
      </Link>
    </li>
  );
}
