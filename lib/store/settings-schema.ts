/**
 * Store settings live in the key/value `settings` table, so adding one needs
 * no schema change. Every commercial promise the storefront can make is a
 * setting here: an empty value means the promise is simply not shown.
 * Nothing on the site states a guarantee the store owner has not entered.
 */
export interface StoreSettings {
  storeName: string;
  /** `null` when unset or still the seed placeholder — ordering is then disabled. */
  whatsappNumber: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  /** Order total (MRU) above which delivery is free. */
  freeDeliveryThreshold: number | null;
  returnDays: number | null;
  authenticityGuarantee: boolean;
  /** Real figures entered by the owner — displayed as-is, never estimated. */
  customersServed: number | null;
  ordersDelivered: number | null;
}

export const SETTING_KEYS = {
  storeName: 'store_name',
  whatsappNumber: 'whatsapp_number',
  contactEmail: 'contact_email',
  instagramUrl: 'instagram_url',
  facebookUrl: 'facebook_url',
  tiktokUrl: 'tiktok_url',
  deliveryDaysMin: 'delivery_days_min',
  deliveryDaysMax: 'delivery_days_max',
  freeDeliveryThreshold: 'free_delivery_threshold',
  returnDays: 'return_days',
  authenticityGuarantee: 'authenticity_guarantee',
  customersServed: 'customers_served',
  ordersDelivered: 'orders_delivered',
} as const satisfies Record<keyof StoreSettings, string>;

export const DEFAULT_STORE_NAME = 'España a Mauritania';

const PLACEHOLDER_PHONE = /X/i;

function text(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function positiveNumber(value: string | undefined): number | null {
  const n = Number(value);
  return value?.trim() && Number.isFinite(n) && n > 0 ? n : null;
}

function url(value: string | undefined): string | null {
  const v = text(value);
  return v && /^https?:\/\//i.test(v) ? v : null;
}

export function parseSettings(rows: Array<{ key: string; value: string | null }>): StoreSettings {
  const raw: Record<string, string | undefined> = {};
  for (const row of rows) raw[row.key] = row.value ?? undefined;
  const get = (key: keyof StoreSettings) => raw[SETTING_KEYS[key]];

  const phone = text(get('whatsappNumber'));
  const min = positiveNumber(get('deliveryDaysMin'));
  const max = positiveNumber(get('deliveryDaysMax'));

  return {
    storeName: text(get('storeName')) ?? DEFAULT_STORE_NAME,
    whatsappNumber:
      phone && !PLACEHOLDER_PHONE.test(phone) && phone.replace(/\D/g, '').length >= 8 ? phone : null,
    contactEmail: text(get('contactEmail')),
    instagramUrl: url(get('instagramUrl')),
    facebookUrl: url(get('facebookUrl')),
    tiktokUrl: url(get('tiktokUrl')),
    // A range is only meaningful with both ends, in order.
    deliveryDaysMin: min && max && min <= max ? min : null,
    deliveryDaysMax: min && max && min <= max ? max : null,
    freeDeliveryThreshold: positiveNumber(get('freeDeliveryThreshold')),
    returnDays: positiveNumber(get('returnDays')),
    authenticityGuarantee: get('authenticityGuarantee') === 'true',
    customersServed: positiveNumber(get('customersServed')),
    ordersDelivered: positiveNumber(get('ordersDelivered')),
  };
}

export function hasDeliveryEstimate(
  s: Pick<StoreSettings, 'deliveryDaysMin' | 'deliveryDaysMax'>
): s is { deliveryDaysMin: number; deliveryDaysMax: number } {
  return s.deliveryDaysMin !== null && s.deliveryDaysMax !== null;
}
