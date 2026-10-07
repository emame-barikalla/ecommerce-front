import { redirect } from 'next/navigation';

/**
 * Order tracking is disabled: orders are confirmed and followed up on
 * WhatsApp. Old links (e.g. from earlier confirmations) land on the homepage.
 */
export default function TrackOrderPage({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}`);
}
