import { redirect } from 'next/navigation';

/**
 * Order tracking is disabled: orders are confirmed and followed up on
 * WhatsApp. Old links (e.g. from earlier confirmations) land on the homepage.
 */
export default async function TrackOrderPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  redirect(`/${locale}`);
}
