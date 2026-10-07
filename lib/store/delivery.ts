import type { Availability } from '@/lib/types/database';
import { hasDeliveryEstimate, type StoreSettings } from '@/lib/store/settings-schema';

/**
 * Where an order ships from:
 * - `local`: already in stock in Mauritania — delivered within a day.
 * - `spain`: ordered from Spain for the customer — the Spain estimate applies.
 *
 * `in_stock` / `low_stock` mean stock held in Mauritania. `on_order` — and a
 * product with no status recorded, which is how the catalog worked before
 * local stock existed — is ordered from Spain. Sold-out items have neither.
 */
export type DeliverySource = 'local' | 'spain';

export function deliverySource(availability: Availability | null | undefined): DeliverySource | null {
  if (availability === 'out_of_stock') return null;
  if (availability === 'in_stock' || availability === 'low_stock') return 'local';
  return 'spain';
}

export const LOCAL_DELIVERY_DAYS = 1;

/** Used until the owner enters their own range in the admin settings. */
const DEFAULT_SPAIN_DAYS = { min: 7, max: 14 };

export function spainDeliveryDays(
  settings: Pick<StoreSettings, 'deliveryDaysMin' | 'deliveryDaysMax'>
): { min: number; max: number } {
  return hasDeliveryEstimate(settings)
    ? { min: settings.deliveryDaysMin, max: settings.deliveryDaysMax }
    : DEFAULT_SPAIN_DAYS;
}
