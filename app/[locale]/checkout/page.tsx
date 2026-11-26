import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CheckoutFlow from './CheckoutFlow';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'checkout' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    // A per-visitor page with nothing to index.
    robots: { index: false, follow: true },
  };
}

export default async function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);
  return <CheckoutFlow />;
}
