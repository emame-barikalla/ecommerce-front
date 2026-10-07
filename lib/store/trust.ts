import type { StoreSettings } from '@/lib/store/settings-schema';
import { LOCAL_DELIVERY_DAYS, spainDeliveryDays } from '@/lib/store/delivery';

/**
 * Every reassurance the storefront shows is derived from store settings.
 * `whatsapp` is always true (it is how ordering works); everything else only
 * appears once the owner has entered it in the admin.
 *
 * Translation keys: `trust.<key>.title` / `trust.<key>.desc`.
 */
export type TrustKey =
  | 'whatsapp'
  | 'delivery'
  | 'deliveryConfirmed'
  | 'freeDelivery'
  | 'returns'
  | 'authentic';

export interface TrustItem {
  key: TrustKey;
  values: Record<string, string | number>;
}

export function getTrustItems(settings: StoreSettings, formatPrice: (n: number) => string): TrustItem[] {
  const items: TrustItem[] = [];

  if (settings.freeDeliveryThreshold) {
    items.push({ key: 'freeDelivery', values: { amount: formatPrice(settings.freeDeliveryThreshold) } });
  }
  // Both promises side by side: local stock in a day, Spain orders in the range.
  items.push({ key: 'delivery', values: { days: LOCAL_DELIVERY_DAYS, ...spainDeliveryDays(settings) } });
  if (settings.returnDays) items.push({ key: 'returns', values: { days: settings.returnDays } });
  if (settings.authenticityGuarantee) items.push({ key: 'authentic', values: {} });
  items.push({ key: 'whatsapp', values: {} });

  return items;
}

export interface StoreStat {
  key: 'customers' | 'orders';
  value: number;
}

/** Owner-entered figures only. Nothing is shown when neither is set. */
export function getStoreStats(settings: StoreSettings): StoreStat[] {
  const stats: StoreStat[] = [];
  if (settings.customersServed) stats.push({ key: 'customers', value: settings.customersServed });
  if (settings.ordersDelivered) stats.push({ key: 'orders', value: settings.ordersDelivered });
  return stats;
}
