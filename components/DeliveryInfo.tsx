'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Plane } from 'lucide-react';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { LOCAL_DELIVERY_DAYS, deliverySource, spainDeliveryDays } from '@/lib/store/delivery';
import type { Availability } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

/**
 * Where a product ships from, stated plainly:
 * - in stock in Mauritania → delivery within a day;
 * - ordered from Spain → the Spain estimate.
 * The Spain estimate never appears on a product that is held locally.
 */
export default function DeliveryInfo({
  availability,
  variant = 'full',
  className,
}: {
  availability: Availability | null | undefined;
  /** `full` for the product page, `compact` for cards. */
  variant?: 'full' | 'compact';
  className?: string;
}) {
  const t = useTranslations('delivery');
  const settings = useStoreSettings();
  const source = deliverySource(availability);
  if (!source) return null;

  const spain = spainDeliveryDays(settings);
  const local = source === 'local';

  if (variant === 'compact') {
    return (
      <p
        className={cn(
          'inline-flex items-center gap-1.5 text-caption',
          local ? 'text-success' : 'text-ink-tertiary',
          className
        )}
      >
        <span aria-hidden="true" className={cn('w-1.5 h-1.5 rounded-full shrink-0', local ? 'bg-success' : 'bg-accent')} />
        {local ? t('localShort', { days: LOCAL_DELIVERY_DAYS }) : t('spainShort', spain)}
      </p>
    );
  }

  const Icon = local ? MapPin : Plane;
  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-lg border p-4',
        local ? 'bg-success-subtle border-success/20' : 'bg-accent-subtle border-accent/25',
        className
      )}
    >
      <span
        className={cn(
          'grid place-items-center w-9 h-9 shrink-0 rounded-full bg-surface',
          local ? 'text-success' : 'text-accent'
        )}
      >
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {local ? t('localTitle') : t('spainTitle')}
          <span className="text-ink-secondary font-normal"> — </span>
          <span className={local ? 'text-success' : 'text-accent'}>
            {local ? t('localTime', { days: LOCAL_DELIVERY_DAYS }) : t('spainTime', spain)}
          </span>
        </p>
        <p className="mt-1 text-small text-ink-secondary">{local ? t('localHint') : t('spainHint')}</p>
      </div>
    </div>
  );
}
