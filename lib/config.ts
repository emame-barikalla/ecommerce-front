import type { Locale } from '@/lib/types/database';

export const LOCALES: Locale[] = ['en', 'fr', 'ar'];

/** Arabic is the storefront default: `/` redirects to `/ar`. */
export const DEFAULT_LOCALE: Locale = 'ar';

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Single source for the store scope — every query filters on it. */
export const STORE_ID =
  process.env.NEXT_PUBLIC_STORE_ID ?? '00000000-0000-0000-0000-000000000001';

/** Canonical origin for metadata, sitemap and links inside WhatsApp messages. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://espana-mauritania.com').replace(
  /\/$/,
  ''
);

export const CURRENCY = 'MRU';

/** Supabase Storage bucket that holds product and category images. */
export const IMAGE_BUCKET = 'product-images';

/** Language menu entries, each labelled in its own language. */
export const LOCALE_OPTIONS: Array<{ code: Locale; label: string; short: string }> = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
];
