import type { Availability, Gender, Locale } from '@/lib/types/database';

// The admin is French-only; its copy lives here rather than in next-intl
// messages, which are scoped to the storefront's [locale] segment.

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'Anglais',
  fr: 'Français',
  ar: 'Arabe',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'En stock en Mauritanie (livraison 1 jour)',
  low_stock: 'Stock faible en Mauritanie',
  on_order: 'Sur commande depuis l’Espagne',
  out_of_stock: 'Rupture',
};

export const GENDER_LABELS: Record<Gender, string> = {
  women: 'Femme',
  men: 'Homme',
  unisex: 'Mixte (Femme et Homme)',
};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
