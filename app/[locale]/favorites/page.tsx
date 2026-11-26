import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FavoritesList from './FavoritesList';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'wishlist' });
  return {
    title: t('title'),
    // Per-visitor content stored on the device — nothing to index.
    robots: { index: false, follow: true },
  };
}

export default async function FavoritesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);
  return <FavoritesList />;
}
