'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search, X } from 'lucide-react';
import type { CategoryWithDetails, Locale } from '@/lib/types/database';
import { categoryName } from '@/lib/i18n/localize';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { DEPARTMENTS } from '@/lib/store/departments';
import CartButton from './CartButton';
import FavoritesButton from './FavoritesButton';
import SearchBar from './SearchBar';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import WithSearchParams from './WithSearchParams';
import { IconButton } from './ui/IconButton';
import { cn } from '@/lib/utils/cn';

interface NavLinkItem {
  key: string;
  href: string;
  label: string;
  active: boolean;
}

/**
 * Desktop: departments (Women / Men) lead the navigation, categories sit in a
 * dropdown, and favorites, language, theme and cart live on the end side.
 * Mobile: a slim app bar (logo, search, language, theme) — everything else is
 * in the bottom navigation.
 */
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  const onCatalog = pathname === `/${locale}/catalog`;

  /** Active state comes from `?gender=` / `?sort=`, read under Suspense. */
  const buildLinks = (params: URLSearchParams): NavLinkItem[] => {
    const gender = onCatalog ? params.get('gender') : null;
    const newest = onCatalog && params.get('sort') === 'newest';
    return [
      ...DEPARTMENTS.map((d) => ({
        key: d,
        href: `/${locale}/catalog?gender=${d}`,
        label: t(d),
        active: gender === d,
      })),
      { key: 'new', href: `/${locale}/catalog?sort=newest`, label: t('newIn'), active: newest && !gender },
    ];
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-header bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
        'transition-[border-color,box-shadow] duration-300',
        scrolled ? 'border-b border-line shadow-xs' : 'border-b border-transparent'
      )}
    >
      <nav aria-label={t('primary')} className="container-page">
        <div className="flex items-center gap-1 md:gap-3 h-header">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 h-11 min-w-0 lg:shrink-0 lg:me-8">
            <Image src="/assets/logo_shop.svg" alt="" width={30} height={30} priority className="shrink-0 rounded-xs" />
            {/* dir=auto: a Latin store name truncates at its own end, even on /ar */}
            <span dir="auto" className="font-display text-lg leading-none tracking-[-0.01em] text-ink whitespace-nowrap truncate">
              {storeName}
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-1 min-w-0">
            <WithSearchParams
              render={(params) =>
                buildLinks(params).map((link) => (
                  <li key={link.key}>
                    <NavLink {...link} />
                  </li>
                ))
              }
            />
            {categories.length > 0 && (
              <li>
                <CategoriesMenu categories={categories} locale={locale} label={t('categories')} allLabel={t('shopAll')} />
              </li>
            )}
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

            <LanguageSwitcher />
            <ThemeToggle />

            {/* On mobile these two live in the bottom navigation */}
            <FavoritesButton className="hidden lg:grid" />
            <CartButton onClick={onOpenCart} className="hidden lg:grid" />
          </div>
        </div>

        {searchOpen && (
          <div className="lg:hidden pb-3 animate-fade-in">
            <SearchBar autoFocus onSubmitted={() => setSearchOpen(false)} />
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ href, label, active }: NavLinkItem) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative block px-3 py-2 text-sm whitespace-nowrap transition-colors',
        active ? 'text-ink font-medium' : 'text-ink-secondary hover:text-ink'
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-3 -bottom-px h-px bg-brand transition-transform duration-200',
          active ? 'scale-x-100' : 'scale-x-0'
        )}
      />
    </Link>
  );
}

/** Disclosure dropdown — plain links, so Tab navigation keeps working. */
function CategoriesMenu({
  categories,
  locale,
  label,
  allLabel,
}: {
  categories: CategoryWithDetails[];
  locale: Locale;
  label: string;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-ink-secondary hover:text-ink transition-colors"
      >
        {label}
        <ChevronDown size={14} aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute start-0 top-full mt-2 min-w-[14rem] rounded-lg border border-line bg-surface shadow-lg p-1.5 z-drawer animate-fade-in"
        >
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/${locale}/catalog?category=${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-sm text-sm text-ink hover:bg-surface-sunken transition-colors"
              >
                {categoryName(cat, locale)}
              </Link>
            </li>
          ))}
          <li className="mt-1 pt-1 border-t border-line">
            <Link
              href={`/${locale}/catalog`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-sm text-sm font-medium text-brand hover:bg-surface-sunken transition-colors"
            >
              {allLabel}
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
