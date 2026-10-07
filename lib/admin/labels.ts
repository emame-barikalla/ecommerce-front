import type { Availability, Locale } from '@/lib/types/database';

// The admin is French-only; its copy lives here rather than in next-intl
// messages, which are scoped to the storefront's [locale] segment.

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'Anglais',
  fr: 'Français',
  ar: 'Arabe',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  on_order: 'Sur commande',
  out_of_stock: 'Rupture',
};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
