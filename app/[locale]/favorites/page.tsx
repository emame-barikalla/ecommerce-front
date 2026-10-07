import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FavoritesList from './FavoritesList';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'wishlist' });
  return {
    title: t('title'),
    // Per-visitor content stored on the device — nothing to index.
    robots: { index: false, follow: true },
  };
}

export default function FavoritesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <FavoritesList />;
}
