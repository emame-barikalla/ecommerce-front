'use client';

import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { cn } from '@/lib/utils/cn';

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
      className={cn(
        'relative grid place-items-center w-11 h-11 rounded-md text-ink transition-colors hover:bg-surface-sunken',
        className
      )}
    >
      <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          key={itemCount}
          aria-hidden="true"
          className="absolute top-1.5 end-1.5 grid place-items-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-ink text-ink-inverse text-micro font-medium tabular ring-2 ring-white animate-pop"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
