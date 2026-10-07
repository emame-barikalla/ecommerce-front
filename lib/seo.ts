import type { Metadata } from 'next';
import { LOCALES, SITE_URL } from '@/lib/config';
import type { Availability } from '@/lib/types/database';

/**
 * Canonical + hreflang for a locale-agnostic path (e.g. `/catalog/foo`).
 * `x-default` points at English, the middleware's default locale.
 */
export function localizedAlternates(locale: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
      'x-default': `/en${path}`,
    },
  };
}

export const SCHEMA_AVAILABILITY: Record<Availability, string> = {
  in_stock: 'https://schema.org/InStock',
  low_stock: 'https://schema.org/LimitedAvailability',
  on_order: 'https://schema.org/BackOrder',
  out_of_stock: 'https://schema.org/OutOfStock',
};

export function breadcrumbJsonLd(items: Array<{ name: string; path?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };
}

/** Serialises JSON-LD safely for inline <script> (no `</script>` breakout). */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
