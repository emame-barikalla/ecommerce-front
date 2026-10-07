'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Check, Heart, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { MAX_QUANTITY } from '@/lib/hooks/useCart';
import { localizedName } from '@/lib/i18n/localize';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import type { Availability, Locale, ProductWithDetails } from '@/lib/types/database';
import { Button, buttonStyles } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { formatPrice } from '@/components/ui/Price';
import { cn } from '@/lib/utils/cn';

const AVAILABILITY_TONE: Record<Availability, { text: string; dot: string }> = {
  in_stock: { text: 'text-success', dot: 'bg-success' },
  low_stock: { text: 'text-accent', dot: 'bg-accent' },
  on_order: { text: 'text-ink-secondary', dot: 'bg-ink-tertiary' },
  out_of_stock: { text: 'text-error', dot: 'bg-error' },
};

export default function ProductActions({
  product,
  productUrl,
}: {
  product: ProductWithDetails;
  productUrl: string;
}) {
  const t = useTranslations('catalog');
  const tw = useTranslations('wishlist');
  const locale = useLocale() as Locale;
  const { addToCart } = useCartContext();
  const { whatsappNumber } = useStoreSettings();
  const { isWishlisted, toggle } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const name = localizedName(product, locale, product.slug);
  const wishlisted = isWishlisted(product.id);
  const availability = product.availability;
  const soldOut = availability === 'out_of_stock';

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    toast.success(t('addedToCart'), { description: `${name} × ${quantity}` });
    setTimeout(() => setAdded(false), 2000);
  };

  const addLabel = added ? t('added') : t('addToCart');

  return (
    <>
      <div className="space-y-4">
        {/* Shown only when the store has recorded a status — never assumed. */}
        {availability && (
          <p className={cn('flex items-center gap-2 text-small font-medium', AVAILABILITY_TONE[availability].text)}>
            <span aria-hidden="true" className={cn('w-2 h-2 rounded-full', AVAILABILITY_TONE[availability].dot)} />
            {t(`availability.${availability}`)}
          </p>
        )}

        {!soldOut && (
          <div className="flex items-center gap-4">
            <span className="t-label">{t('quantity')}</span>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={MAX_QUANTITY}
              decreaseLabel={t('decrease')}
              increaseLabel={t('increase')}
            />
          </div>
        )}

        <div className="flex items-stretch gap-2.5">
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={soldOut}
            className={cn('flex-1', added && 'bg-success hover:bg-success')}
          >
            {added ? <Check size={17} aria-hidden="true" /> : <ShoppingBag size={17} aria-hidden="true" />}
            {soldOut ? t('availability.out_of_stock') : addLabel}
          </Button>
          <IconButton
            label={wishlisted ? tw('remove') : tw('add')}
            aria-pressed={wishlisted}
            variant="outline"
            onClick={() => toggle(product.id)}
            className="w-[3.25rem] h-[3.25rem]"
          >
            <Heart size={17} aria-hidden="true" className={wishlisted ? 'fill-sale text-sale' : 'fill-none'} />
          </IconButton>
        </div>

        {whatsappNumber && (
          <a
            href={buildWhatsAppUrl(whatsappNumber, t('productWhatsApp', { name, url: productUrl }))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'outline', size: 'lg', fullWidth: true })}
          >
            <MessageCircle size={17} aria-hidden="true" />
            {t('askWhatsApp')}
          </a>
        )}
      </div>

      {/* Sticky mobile purchase bar */}
      {!soldOut && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-header bg-white/95 backdrop-blur-md border-t border-line"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="container-page flex items-center gap-3 py-3">
            <div className="min-w-0">
              <p className="text-caption text-ink-tertiary truncate">{t('total')}</p>
              <p className="text-sm font-medium tabular text-ink">
                <bdi>{formatPrice(product.price * quantity)}</bdi>
              </p>
            </div>
            <Button onClick={handleAddToCart} className={cn('flex-1 min-w-0', added && 'bg-success hover:bg-success')}>
              {added ? <Check size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
              <span className="truncate">{addLabel}</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
