'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWishlist } from './useWishlist';

/**
 * Wishlist toggle with feedback: a toast confirms the change and offers a
 * shortcut to the favorites page, so customers learn where saved items live.
 * Favorites are stored on the device — no sign-in is needed.
 */
export function useFavoriteToggle() {
  const t = useTranslations('wishlist');
  const locale = useLocale();
  const router = useRouter();
  const { isWishlisted, toggle } = useWishlist();

  const toggleFavorite = useCallback(
    (productId: string, name: string) => {
      const adding = !isWishlisted(productId);
      toggle(productId);
      if (adding) {
        toast.success(t('added'), {
          description: name,
          action: { label: t('view'), onClick: () => router.push(`/${locale}/favorites`) },
        });
      } else {
        toast(t('removed'), { description: name });
      }
    },
    [isWishlisted, toggle, t, router, locale]
  );

  return { isWishlisted, toggleFavorite };
}
