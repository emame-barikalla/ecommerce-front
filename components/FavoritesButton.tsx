'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { cn } from '@/lib/utils/cn';
import CountBadge from './ui/CountBadge';

/** Header link to the favorites page, with a live count. */
export default function FavoritesButton({ className }: { className?: string }) {
  const t = useTranslations('wishlist');
  const locale = useLocale();
  const { wishlist } = useWishlist();
  const count = wishlist.length;

  return (
    <Link
      href={`/${locale}/favorites`}
      aria-label={count > 0 ? t('openWithCount', { count }) : t('title')}
      title={t('title')}
      className={cn(
        'relative grid place-items-center w-11 h-11 rounded-md text-ink transition-colors hover:bg-surface-sunken',
        className
      )}
    >
      <Heart size={20} strokeWidth={1.6} aria-hidden="true" />
      <CountBadge count={count} className="top-1.5 end-1.5" />
    </Link>
  );
}
