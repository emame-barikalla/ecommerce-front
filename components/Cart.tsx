'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, ShoppingBag, X } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { cartProductName, type CartIssue, type CartItem } from '@/lib/hooks/useCart';
import { hasDeliveryEstimate } from '@/lib/store/settings-schema';
import type { Locale } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';
import Drawer from './ui/Drawer';
import EmptyState from './ui/EmptyState';
import QuantityStepper from './ui/QuantityStepper';
import { IconButton } from './ui/IconButton';
import { ConfirmDialog } from './ui/Dialog';
import { buttonStyles } from './ui/Button';
import { formatPrice } from './ui/Price';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const settings = useStoreSettings();
  const { cart, issues, subtotal, totalItems, removeFromCart, updateQuantity, clearCart, refresh } =
    useCartContext();
  const [confirmClear, setConfirmClear] = useState(false);

  // Reconcile the stored snapshot with the database each time the drawer opens.
  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, refresh]);

  const hasItems = cart.length > 0;

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        title={t('title')}
        closeLabel={t('close')}
        headerAction={
          hasItems ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="h-9 px-2.5 rounded-sm text-caption text-ink-tertiary hover:text-error hover:bg-error-subtle transition-colors"
            >
              {t('clear')}
            </button>
          ) : null
        }
        footer={
          hasItems ? (
            <div className="p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-small text-ink-secondary">{t('subtotal', { count: totalItems })}</span>
                <span className="text-lg font-medium tabular text-ink">{formatPrice(subtotal)}</span>
              </div>
              {hasDeliveryEstimate(settings) && (
                <p className="text-caption text-ink-tertiary">
                  {t('deliveryEstimate', { min: settings.deliveryDaysMin, max: settings.deliveryDaysMax })}
                </p>
              )}
              <Link
                href={`/${locale}/checkout`}
                onClick={onClose}
                className={buttonStyles({ size: 'lg', fullWidth: true })}
              >
                {t('checkout')}
              </Link>
              <p className="text-center text-caption text-ink-tertiary">{t('checkoutHint')}</p>
            </div>
          ) : null
        }
      >
        {hasItems ? (
          <ul className="divide-y divide-line px-5">
            {cart.map((item) => (
              <CartLine
                key={item.product.id}
                item={item}
                issue={issues[item.product.id]}
                locale={locale}
                onNavigate={onClose}
                onRemove={() => removeFromCart(item.product.id)}
                onQuantity={(q) => updateQuantity(item.product.id, q)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title={t('empty')}
            description={t('emptyHint')}
            action={
              <Link href={`/${locale}/catalog`} onClick={onClose} className={buttonStyles()}>
                {t('continueShopping')}
              </Link>
            }
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        title={t('clearTitle')}
        description={t('clearDescription')}
        confirmLabel={t('clearConfirm')}
        cancelLabel={tCommon('cancel')}
        tone="danger"
      />
    </>
  );
}

interface CartLineProps {
  item: CartItem;
  issue?: CartIssue;
  locale: Locale;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
  /** Called when a product link is followed (the drawer closes itself). */
  onNavigate?: () => void;
}

/** One cart row, shared by the drawer and the checkout review step. */
export function CartLine({ item, issue, locale, onNavigate, onRemove, onQuantity }: CartLineProps) {
  const t = useTranslations('cart');
  const { product, quantity } = item;
  const name = cartProductName(product, locale);
  const href = `/${locale}/catalog/${product.slug}`;
  const unavailable = issue === 'unavailable';

  return (
    <li className="flex gap-4 py-5">
      {/* Decorative duplicate of the name link — kept out of the tab order */}
      <Link
        href={href}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          'relative w-20 aspect-product shrink-0 rounded-sm overflow-hidden bg-surface-sunken',
          unavailable && 'opacity-50'
        )}
      >
        {product.image ? (
          <Image src={product.image.url} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="grid place-items-center w-full h-full text-ink-tertiary">
            <ImageOff size={16} aria-hidden="true" />
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={href}
            onClick={onNavigate}
            className={cn(
              'text-sm leading-snug line-clamp-2 hover:underline underline-offset-4',
              unavailable ? 'text-ink-tertiary' : 'text-ink'
            )}
          >
            {name}
          </Link>
          <IconButton
            label={`${t('remove')} — ${name}`}
            variant="danger"
            size="sm"
            onClick={onRemove}
            className="-me-2 -mt-2"
          >
            <X size={15} aria-hidden="true" />
          </IconButton>
        </div>

        <p className="mt-0.5 text-caption text-ink-tertiary tabular">{formatPrice(product.price)}</p>
        {issue && (
          <p className={cn('mt-1 text-caption font-medium', unavailable ? 'text-error' : 'text-accent')}>
            {unavailable ? t('unavailable') : t('priceChanged')}
          </p>
        )}

        {!unavailable && (
          <div className="mt-auto pt-3 flex items-center justify-between gap-3">
            <QuantityStepper
              size="sm"
              value={quantity}
              onChange={onQuantity}
              min={0}
              decreaseLabel={t('decrease')}
              increaseLabel={t('increase')}
            />
            <span className="text-sm font-medium tabular text-ink">{formatPrice(product.price * quantity)}</span>
          </div>
        )}
      </div>
    </li>
  );
}
