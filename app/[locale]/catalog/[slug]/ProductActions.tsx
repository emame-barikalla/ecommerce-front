'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { useFavoriteToggle } from '@/lib/hooks/useFavoriteToggle';
import { MAX_QUANTITY } from '@/lib/hooks/useCart';
import { localizedName } from '@/lib/i18n/localize';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import { sizeKind, sizeValues } from '@/lib/utils/size';
import { LOCAL_DELIVERY_DAYS, deliverySource, spainDeliveryDays } from '@/lib/store/delivery';
import type { Availability, Locale, ProductWithDetails } from '@/lib/types/database';
import { Button, buttonStyles } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { formatPrice } from '@/components/ui/Price';
import { WhatsAppGlyph } from '@/components/WhatsAppButton';
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
  const tDelivery = useTranslations('delivery');
  const locale = useLocale() as Locale;
  const { addToCart } = useCartContext();
  const settings = useStoreSettings();
  const { whatsappNumber } = settings;
  const { isWishlisted, toggleFavorite } = useFavoriteToggle();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const name = localizedName(product, locale, product.slug);
  const wishlisted = isWishlisted(product.id);
  const availability = product.availability;
  const soldOut = availability === 'out_of_stock';
  const sizes = sizeValues(product.size);
  const source = deliverySource(availability);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    toast.success(t('addedToCart'), { description: `${name} × ${quantity}` });
    setTimeout(() => setAdded(false), 2000);
  };

  // Everything the team needs to confirm in one message: product, size,
  // quantity, price and where it ships from.
  const whatsappMessage = [
    t('orderWhatsAppGreeting'),
    '',
    `• ${name}`,
    sizes.length ? `${t(sizeKind(sizes[0]) === 'volume' ? 'volume' : 'size')}: ${sizes.join(', ')}` : null,
    `${t('quantity')}: ${quantity}`,
    `${t('total')}: ${formatPrice(product.price * quantity)}`,
    source === 'local'
      ? `${tDelivery('localTitle')} — ${tDelivery('localTime', { days: LOCAL_DELIVERY_DAYS })}`
      : source === 'spain'
        ? `${tDelivery('spainTitle')} — ${tDelivery('spainTime', spainDeliveryDays(settings))}`
        : null,
    productUrl,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
  const whatsappHref = whatsappNumber ? buildWhatsAppUrl(whatsappNumber, whatsappMessage) : null;

  const addLabel = added ? t('added') : t('addToCart');

  return (
    <>
      <div className="space-y-5">
        {/* Shown only when the store has recorded a status — never assumed. */}
        {availability && (
          <p className={cn('flex items-center gap-2 text-small font-medium', AVAILABILITY_TONE[availability].text)}>
            <span aria-hidden="true" className={cn('w-2 h-2 rounded-full', AVAILABILITY_TONE[availability].dot)} />
            {t(`availability.${availability}`)}
          </p>
        )}

        {sizes.length > 0 && (
          <div>
            <p className="t-label mb-2.5">{t(sizeKind(sizes[0]) === 'volume' ? 'volume' : 'size')}</p>
            <ul className="flex flex-wrap gap-2" dir="ltr">
              {sizes.map((s) => (
                <li
                  key={s}
                  className="inline-flex items-center justify-center min-w-[3rem] h-10 px-3.5 rounded-md border border-line-strong bg-surface text-sm font-medium text-ink tabular"
                >
                  {s}
                </li>
              ))}
            </ul>
            {sizes.length > 1 && <p className="mt-2 text-caption text-ink-tertiary">{t('sizeOnWhatsApp')}</p>}
          </div>
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

        {/* Ordering happens on WhatsApp, so the direct route leads. */}
        {whatsappHref && !soldOut && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'whatsapp', size: 'lg', fullWidth: true })}
          >
            <WhatsAppGlyph size={19} />
            {t('orderWhatsApp')}
          </a>
        )}

        <div className="flex items-stretch gap-2.5">
          <Button
            size="lg"
            variant={whatsappHref ? 'outline' : 'primary'}
            onClick={handleAddToCart}
            disabled={soldOut}
            className={cn('flex-1', added && '!bg-success !text-ink-inverse !border-success')}
          >
            {added ? <Check size={17} aria-hidden="true" /> : <ShoppingBag size={17} aria-hidden="true" />}
            {soldOut ? t('availability.out_of_stock') : addLabel}
          </Button>
          <IconButton
            label={wishlisted ? tw('remove') : tw('add')}
            aria-pressed={wishlisted}
            variant="outline"
            onClick={() => toggleFavorite(product.id, name)}
            className="w-[3.25rem] h-[3.25rem]"
          >
            <Heart size={18} aria-hidden="true" className={wishlisted ? 'fill-brand text-brand' : 'fill-none'} />
          </IconButton>
        </div>

        {whatsappHref && (
          <p className="text-caption text-ink-tertiary text-center">{t('orderWhatsAppHint')}</p>
        )}
        {whatsappHref && soldOut && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'outline', size: 'lg', fullWidth: true })}
          >
            <WhatsAppGlyph size={18} />
            {t('askWhatsApp')}
          </a>
        )}
      </div>

      {/* Sticky mobile purchase bar — replaces the bottom navigation here */}
      {!soldOut && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-header bg-surface/95 backdrop-blur-md border-t border-line pb-safe">
          <div className="container-page flex items-center gap-2.5 py-3">
            <div className="min-w-0 me-1">
              <p className="text-caption text-ink-tertiary truncate">{t('total')}</p>
              <p className="text-sm font-semibold tabular text-ink whitespace-nowrap">
                <bdi>{formatPrice(product.price * quantity)}</bdi>
              </p>
            </div>
            <Button
              variant={whatsappHref ? 'outline' : 'primary'}
              onClick={handleAddToCart}
              aria-label={addLabel}
              className={cn('min-w-0 px-4', whatsappHref ? 'shrink-0' : 'flex-1', added && '!bg-success !text-ink-inverse !border-success')}
            >
              {added ? <Check size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
              <span className={cn('truncate', whatsappHref && 'sr-only sm:not-sr-only')}>{addLabel}</span>
            </Button>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: 'whatsapp', className: 'flex-1 min-w-0 px-4' })}
              >
                <WhatsAppGlyph size={17} />
                <span className="truncate">{t('orderShort')}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
