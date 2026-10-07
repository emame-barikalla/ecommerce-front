'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Heart, ImageOff, Plus } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { categoryName, localizedName, sortImages } from '@/lib/i18n/localize';
import type { ProductWithDetails, Locale } from '@/lib/types/database';
import { Badge } from './ui/Badge';
import Price, { discountPercent } from './ui/Price';
import { cn } from '@/lib/utils/cn';

const NEW_FOR_DAYS = 30;

interface ProductCardProps {
  product: ProductWithDetails;
  locale: Locale;
  /** Feeds `next/image` sizes; set on grids that are not the default 4-up. */
  sizes?: string;
  priority?: boolean;
}

export default function ProductCard({
  product,
  locale,
  sizes = '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw',
  priority,
}: ProductCardProps) {
  const t = useTranslations('catalog');
  const tw = useTranslations('wishlist');
  const { addToCart } = useCartContext();
  const { isWishlisted, toggle } = useWishlist();
  const [added, setAdded] = useState(false);

  const name = localizedName(product, locale, product.slug);
  const category = product.category ? categoryName(product.category, locale) : '';
  const [primary, secondary] = sortImages(product.images);

  const soldOut = product.availability === 'out_of_stock';
  const discount = discountPercent(product.price, product.compare_at_price);
  const isNew = Date.now() - new Date(product.created_at).getTime() < NEW_FOR_DAYS * 86_400_000;
  const wishlisted = isWishlisted(product.id);
  const href = `/${locale}/catalog/${product.slug}`;

  const handleAdd = () => {
    addToCart(product, 1);
    setAdded(true);
    toast.success(t('addedToCart'), { description: name });
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-product overflow-hidden rounded-lg bg-surface-sunken">
        {/* Not a link: the stretched link on the title covers the whole card,
            so a second overlapping link would only add tab-stop noise. */}
        {primary ? (
          <>
            <Image
              src={primary.image_url}
              alt=""
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                'object-cover transition-opacity duration-500 ease-out',
                secondary && 'md:group-hover:opacity-0',
                soldOut && 'opacity-60'
              )}
            />
            {secondary && (
              <Image
                src={secondary.image_url}
                alt=""
                fill
                sizes={sizes}
                className="hidden md:block object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="grid place-items-center w-full h-full text-ink-tertiary">
            <ImageOff size={22} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}

        {/* One badge at most, in priority order — stacked badges read as noise. */}
        <div className="absolute top-3 start-3 pointer-events-none">
          {soldOut ? (
            <Badge variant="outline">{t('availability.out_of_stock')}</Badge>
          ) : discount ? (
            <Badge variant="sale">{t('badgeSale', { percent: discount })}</Badge>
          ) : isNew ? (
            <Badge variant="new">{t('badgeNew')}</Badge>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={`${wishlisted ? tw('remove') : tw('add')} — ${name}`}
          aria-pressed={wishlisted}
          className={cn(
            'absolute z-10 top-1.5 end-1.5 grid place-items-center w-11 h-11 rounded-full text-ink',
            'transition-opacity duration-200',
            // Always visible on touch, revealed on hover for pointer devices
            'md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
            wishlisted && 'md:opacity-100'
          )}
        >
          <span className="grid place-items-center w-8 h-8 rounded-full bg-white/90 shadow-xs">
            <Heart size={15} aria-hidden="true" className={wishlisted ? 'fill-sale text-sale' : 'fill-none'} />
          </span>
        </button>

        {!soldOut && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`${t('addToCart')} — ${name}`}
            className={cn(
              'absolute z-10 bottom-2.5 end-2.5 md:inset-x-2.5 md:end-auto md:w-[calc(100%-1.25rem)]',
              'inline-flex items-center justify-center gap-2 h-11 w-11 rounded-md shadow-xs',
              'text-small font-medium transition-all duration-200 active:scale-[0.97]',
              'md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100',
              'focus-visible:translate-y-0 focus-visible:opacity-100',
              added ? 'bg-success text-white' : 'bg-white text-ink hover:bg-ink hover:text-ink-inverse'
            )}
          >
            {added ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" className="md:hidden" />
            )}
            <span className="hidden md:inline">{added ? t('added') : t('addToCart')}</span>
          </button>
        )}
      </div>

      <div className="pt-3.5 flex flex-col gap-1">
        {category && <p className="t-label">{category}</p>}
        <h3 className="text-sm leading-snug text-ink">
          {/* Stretched link: the whole card is clickable, but only one link is
              exposed to assistive tech and the buttons above stay reachable. */}
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            <span className="line-clamp-2">{name}</span>
          </Link>
        </h3>
        <Price value={product.price} compareAt={product.compare_at_price} size="sm" className="mt-0.5" />
      </div>
    </article>
  );
}
