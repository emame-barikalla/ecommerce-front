import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { BottomNavSpacer } from '@/components/BottomNav';
import ToastProvider from '@/components/ToastProvider';
import { CartProvider } from '@/lib/context/CartContext';
import { StoreSettingsProvider } from '@/lib/context/StoreSettingsContext';
import { getCategoriesServer, getStoreSettings } from '@/lib/utils/supabase-server';
import { formatPrice } from '@/components/ui/Price';
import { LOCALES, SITE_URL, isLocale } from '@/lib/config';
import { fontVariables } from '@/lib/fonts';
import { LOCAL_DELIVERY_DAYS, spainDeliveryDays } from '@/lib/store/delivery';
import { THEME_BOOT, THEME_COLORS } from '@/lib/theme';

/** Public pages are static and refreshed at most once a minute (ISR). */
export const revalidate = 60;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: settings.storeName, template: `%s · ${settings.storeName}` },
    openGraph: { siteName: settings.storeName, type: 'website', locale: params.locale },
    twitter: { card: 'summary_large_image' },
  };
}

export const viewport: Viewport = {
  themeColor: THEME_COLORS.light,
  // Lets fixed bars use env(safe-area-inset-*) on notched phones.
  viewportFit: 'cover',
};

/**
 * Announcements pause while dismissed for the session. This runs before first
 * paint so a returning visitor never sees the bar flash in and collapse.
 */
const ANNOUNCEMENT_BOOT = `try{if(sessionStorage.getItem('announcement_dismissed_v1')==='1')document.documentElement.dataset.announcement='hidden'}catch(e){}`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [messages, settings, categories, t, tAnnouncement] = await Promise.all([
    getMessages(),
    getStoreSettings(),
    getCategoriesServer(),
    getTranslations('a11y'),
    getTranslations('announcement'),
  ]);

  // Rotating announcements are built from settings, so the bar only ever
  // repeats promises the store has actually made.
  const announcements = [
    settings.freeDeliveryThreshold
      ? tAnnouncement('freeDelivery', { amount: formatPrice(settings.freeDeliveryThreshold) })
      : null,
    tAnnouncement('delivery', { days: LOCAL_DELIVERY_DAYS, ...spainDeliveryDays(settings) }),
    tAnnouncement('whatsapp'),
    settings.authenticityGuarantee ? tAnnouncement('authentic') : null,
  ].filter((m): m is string => !!m);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    // `lang`/`dir` come from the server now, so crawlers, screen readers and
    // no-JS visitors get the right language and direction on first byte.
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT + ANNOUNCEMENT_BOOT }} />
      </head>
      <body className="font-sans antialiased bg-background text-ink">
        <NextIntlClientProvider messages={messages}>
          <StoreSettingsProvider settings={settings}>
            <CartProvider>
              <ToastProvider dir={dir} />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-ink focus:text-ink-inverse focus:rounded-md focus:text-sm"
              >
                {t('skipToContent')}
              </a>
              <Navigation categories={categories} announcements={announcements} />
              <main id="main-content" className="min-h-[60vh]">
                {children}
              </main>
              <Footer locale={locale} />
              <BottomNavSpacer />
              <WhatsAppButton />
            </CartProvider>
          </StoreSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
