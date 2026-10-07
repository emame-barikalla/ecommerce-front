import { getTranslations } from 'next-intl/server';
import { MessageCircle, RotateCcw, ShieldCheck, Tag, Truck, type LucideIcon } from 'lucide-react';
import { getStoreSettings } from '@/lib/utils/supabase-server';
import { getTrustItems, type TrustKey } from '@/lib/store/trust';
import { formatPrice } from '@/components/ui/Price';
import { cn } from '@/lib/utils/cn';

const ICONS: Record<TrustKey, LucideIcon> = {
  whatsapp: MessageCircle,
  delivery: Truck,
  deliveryConfirmed: Truck,
  freeDelivery: Tag,
  returns: RotateCcw,
  authentic: ShieldCheck,
};

/** Reassurance row. Items come from store settings, so it never overpromises. */
export default async function TrustStrip({ label, className }: { label: string; className?: string }) {
  const [t, settings] = await Promise.all([getTranslations('trust'), getStoreSettings()]);
  const items = getTrustItems(settings, formatPrice).slice(0, 4);

  return (
    <section aria-label={label} className={className}>
      <ul
        className={cn(
          'grid gap-x-6 gap-y-7',
          items.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : items.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
        )}
      >
        {items.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <li key={item.key} className="flex items-start gap-3.5">
              <Icon size={19} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
              <div>
                <h3 className="text-small font-medium text-ink">{t(`${item.key}.title`, item.values)}</h3>
                <p className="text-caption text-ink-secondary mt-0.5">{t(`${item.key}.desc`, item.values)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
