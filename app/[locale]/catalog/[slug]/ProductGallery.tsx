'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GalleryImage {
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

/**
 * Desktop: a vertical thumbnail rail beside a large still.
 * Mobile: a snap-scrolling carousel — no arrows to mis-mirror under RTL, and
 * the browser handles direction natively.
 */
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const t = useTranslations('catalog');
  // Memoised so it is a stable dependency for the scroll effect below.
  const sorted = useMemo(
    () => [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)),
    [images]
  );
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Keep the mobile dot indicator in sync with the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      // Hidden at `lg` (display: none): clientWidth is 0 and the reset scroll
      // event would compute 0 / 0 = NaN, which slips through the clamp below.
      if (track.clientWidth === 0) return;
      // Clamped: over-scroll bounce can push the computed index past the last
      // slide, and `sorted[active]` is read unguarded by the desktop view.
      const raw = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      setActive(Math.min(sorted.length - 1, Math.max(0, raw)));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [sorted.length]);

  if (sorted.length === 0) {
    return (
      <div className="grid place-items-center aspect-editorial rounded-lg bg-surface-sunken text-ink-tertiary">
        <ImageOff size={26} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  const step = (delta: number) => {
    const next = Math.min(sorted.length - 1, Math.max(0, active + delta));
    setActive(next);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3 lg:gap-4">
      {sorted.length > 1 && (
        <>
          {/* Desktop thumbnails */}
          <div
            role="tablist"
            aria-label={t('galleryLabel')}
            className="hidden lg:flex flex-col gap-3 w-20 shrink-0"
          >
            {sorted.map((img, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                aria-label={t('viewImage', { number: i + 1 })}
                onClick={() => setActive(i)}
                className={cn(
                  'relative aspect-square rounded-sm overflow-hidden bg-surface-sunken transition-all',
                  i === active
                    ? 'ring-1 ring-ink ring-offset-2 ring-offset-white'
                    : 'opacity-60 hover:opacity-100'
                )}
              >
                <Image
                  src={img.image_url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Mobile dots */}
          <div className="lg:hidden flex items-center justify-center gap-1.5">
            {sorted.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  'h-1 rounded-full transition-all duration-200',
                  i === active ? 'w-5 bg-ink' : 'w-1 bg-line-strong'
                )}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile: native snap carousel, direction-aware for free */}
        <div
          ref={trackRef}
          className="lg:hidden flex snap-x snap-mandatory overflow-x-auto no-scrollbar rounded-lg"
        >
          {sorted.map((img, i) => (
            <div key={i} className="relative shrink-0 w-full aspect-editorial snap-center bg-surface-sunken">
              <Image
                src={img.image_url}
                alt={img.alt_text || `${productName} — ${i + 1}`}
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop: single large still with keyboard-reachable stepping */}
        <div className="hidden lg:block relative group aspect-editorial rounded-lg overflow-hidden bg-surface-sunken">
          <Image
            key={sorted[active].image_url}
            src={sorted[active].image_url}
            alt={sorted[active].alt_text || productName}
            fill
            sizes="50vw"
            priority
            className="object-cover animate-fade-in"
          />
          {sorted.length > 1 && (
            <>
              <button
                onClick={() => step(-1)}
                disabled={active === 0}
                aria-label={t('previousImage')}
                className="absolute start-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/90 text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-0"
              >
                <ChevronLeft size={17} aria-hidden="true" className="rtl:-scale-x-100" />
              </button>
              <button
                onClick={() => step(1)}
                disabled={active === sorted.length - 1}
                aria-label={t('nextImage')}
                className="absolute end-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/90 text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-0"
              >
                <ChevronRight size={17} aria-hidden="true" className="rtl:-scale-x-100" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
