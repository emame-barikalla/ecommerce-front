import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedAlternates } from '@/lib/seo';

// The catalog page is a client component (filters live in the URL and are
// applied in the browser), so its metadata is provided here.
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: localizedAlternates(locale, '/catalog'),
  };
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
