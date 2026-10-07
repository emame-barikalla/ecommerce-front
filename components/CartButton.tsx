'use client';

import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { cn } from '@/lib/utils/cn';
import CountBadge from './ui/CountBadge';

export default function CartButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const t = useTranslations('cart');
  const { totalItems, isLoaded } = useCartContext();
  // The count comes from localStorage, so it is 0 during SSR and the first
  // paint. Gating on `isLoaded` keeps markup identical across hydration.
  const itemCount = isLoaded ? totalItems : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={itemCount > 0 ? t('openWithCount', { count: itemCount }) : t('open')}
      title={t('title')}
      className={cn(
        'relative grid place-items-center w-11 h-11 rounded-md text-ink transition-colors hover:bg-surface-sunken',
        className
      )}
    >
      <ShoppingBag size={20} strokeWidth={1.6} aria-hidden="true" />
      <CountBadge count={itemCount} className="top-1.5 end-1.5" />
    </button>
  );
}
