'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Heart, Home, LayoutGrid, ShoppingBag, User, type LucideIcon } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { cn } from '@/lib/utils/cn';
import CountBadge from './ui/CountBadge';

/**
 * App-style tab bar for phones and tablets (hidden from `lg`). It respects the
 * home-indicator safe area, and <BottomNavSpacer> (after the footer) keeps it
 * from covering the end of the page. Product pages and checkout hide it: they
 * carry their own sticky action bar, as native shopping apps do.
 */
const HIDDEN_ON = /^\/[a-z]{2}\/(catalog\/.+|checkout)/;

export function BottomNavSpacer() {
  const pathname = usePathname();
  if (HIDDEN_ON.test(pathname)) return null;
  return <div aria-hidden="true" className="lg:hidden h-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))]" />;
}

export default function BottomNav({
  onOpenCart,
  onOpenAccount,
  cartOpen,
  accountOpen,
}: {
  onOpenCart: () => void;
  onOpenAccount: () => void;
  cartOpen: boolean;
  accountOpen: boolean;
}) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { totalItems, isLoaded } = useCartContext();
  const { wishlist } = useWishlist();

  if (HIDDEN_ON.test(pathname)) return null;

  const sheetOpen = cartOpen || accountOpen;
  const home = `/${locale}`;
  const isActive = (href: string) =>
    !sheetOpen && (href === home ? pathname === home : pathname.startsWith(href));

  const cartCount = isLoaded ? totalItems : 0;

  return (
    <nav
      aria-label={t('tabBar')}
      className="lg:hidden fixed inset-x-0 bottom-0 z-bottom-nav bg-surface/90 backdrop-blur-lg border-t border-line pb-safe"
    >
      <ul className="grid grid-cols-5 h-bottom-nav max-w-xl mx-auto">
        <Tab href={home} label={t('home')} Icon={Home} active={isActive(home)} />
        <Tab
          href={`/${locale}/categories`}
          label={t('categories')}
          Icon={LayoutGrid}
          active={isActive(`/${locale}/categories`) || isActive(`/${locale}/catalog`)}
        />
        <Tab
          href={`/${locale}/favorites`}
          label={t('favorites')}
          Icon={Heart}
          active={isActive(`/${locale}/favorites`)}
          count={wishlist.length}
        />
        <Tab label={t('cart')} Icon={ShoppingBag} active={cartOpen} onClick={onOpenCart} count={cartCount} />
        <Tab label={t('account')} Icon={User} active={accountOpen} onClick={onOpenAccount} />
      </ul>
    </nav>
  );
}

function Tab({
  href,
  onClick,
  label,
  Icon,
  active,
  count = 0,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  count?: number;
}) {
  const className = cn(
    'relative flex flex-col items-center justify-center gap-1 w-full h-full text-[0.6875rem] leading-none transition-colors',
    'active:scale-95 transition-transform',
    active ? 'text-brand font-medium' : 'text-ink-tertiary hover:text-ink'
  );
  const content = (
    <>
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2 : 1.6} aria-hidden="true" className={cn(active && 'fill-brand/10')} />
        <CountBadge count={count} className="-top-1.5 -end-2.5" />
      </span>
      <span className="truncate max-w-full px-1">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0 inset-x-1/4 h-0.5 rounded-full bg-brand transition-opacity',
          active ? 'opacity-100' : 'opacity-0'
        )}
      />
    </>
  );

  return (
    <li>
      {href ? (
        <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} aria-expanded={active} className={className}>
          {content}
        </button>
      )}
    </li>
  );
}
