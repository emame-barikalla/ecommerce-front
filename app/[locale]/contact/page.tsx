import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, MessageCircle } from 'lucide-react';
import { getStoreSettings } from '@/lib/utils/supabase-server';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import { localizedAlternates } from '@/lib/seo';
import { buttonStyles } from '@/components/ui/Button';
import ContactForm from './ContactForm';

type Params = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Params): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: localizedAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params: { locale } }: Params) {
  setRequestLocale(locale);
  const [t, tWhatsApp, settings] = await Promise.all([
    getTranslations('contact'),
    getTranslations('whatsapp'),
    getStoreSettings(),
  ]);

  return (
    <>
      <header className="container-page pt-14 md:pt-24 pb-10 md:pb-12">
        <div className="max-w-2xl">
          <p className="t-label mb-4">{t('eyebrow')}</p>
          <h1 className="t-h1">{t('title')}</h1>
          <p className="t-body mt-5 text-base">{t('subtitle')}</p>
        </div>
      </header>

      <div className="container-page pb-section grid lg:grid-cols-[1fr_20rem] gap-12 lg:gap-20 items-start">
        <ContactForm />

        {(settings.whatsappNumber || settings.contactEmail) && (
          <aside className="space-y-8 lg:border-s lg:border-line lg:ps-12">
            {settings.whatsappNumber && (
              <div>
                <h2 className="flex items-center gap-2 text-body font-medium text-ink">
                  <MessageCircle size={16} strokeWidth={1.6} aria-hidden="true" className="text-whatsapp" />
                  {t('whatsapp')}
                </h2>
                <p className="t-small mt-2">{tWhatsApp('instantResponse')}</p>
                <a
                  href={buildWhatsAppUrl(settings.whatsappNumber, tWhatsApp('defaultMessage'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: 'whatsapp', size: 'sm', className: 'mt-4' })}
                >
                  {tWhatsApp('openWhatsApp')}
                </a>
              </div>
            )}

            {settings.contactEmail && (
              <div className="pt-8 border-t border-line first:pt-0 first:border-t-0">
                <h2 className="flex items-center gap-2 text-body font-medium text-ink">
                  <Mail size={16} strokeWidth={1.6} aria-hidden="true" className="text-ink-tertiary" />
                  {t('email')}
                </h2>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-block mt-2 text-small text-ink-secondary hover:text-ink underline-offset-4 hover:underline"
                >
                  <bdi>{settings.contactEmail}</bdi>
                </a>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
