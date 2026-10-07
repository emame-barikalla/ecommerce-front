import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CheckoutFlow from './CheckoutFlow';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'checkout' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    // A per-visitor page with nothing to index.
    robots: { index: false, follow: true },
  };
}

export default function CheckoutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <CheckoutFlow />;
}
