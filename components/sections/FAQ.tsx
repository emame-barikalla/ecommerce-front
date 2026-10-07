import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { getStoreSettings } from '@/lib/utils/supabase-server';
import { hasDeliveryEstimate } from '@/lib/store/settings-schema';

/**
 * Built on native `<details>`: keyboard support, screen-reader semantics and
 * in-page find all work for free, and the section ships zero client JS.
 * Answers that state a commitment (authenticity, returns, delivery time) only
 * appear once the store has entered it in the admin.
 */
export default async function FAQ() {
  const [t, settings] = await Promise.all([getTranslations('faq'), getStoreSettings()]);

  const items = [
    settings.authenticityGuarantee
      ? { key: 'authentic', answer: t('items.authentic.answer') }
      : null,
    {
      key: 'delivery',
      answer: hasDeliveryEstimate(settings)
        ? t('items.delivery.answerWithDays', { min: settings.deliveryDaysMin, max: settings.deliveryDaysMax })
        : t('items.delivery.answer'),
    },
    { key: 'payment', answer: t('items.payment.answer') },
    settings.returnDays
      ? { key: 'returns', answer: t('items.returns.answer', { days: settings.returnDays }) }
      : null,
    { key: 'whatsapp', answer: t('items.whatsapp.answer') },
  ].filter((item): item is { key: string; answer: string } => item !== null);

  return (
    <section aria-labelledby="faq-heading" className="container-narrow">
      <h2 id="faq-heading" className="t-h2 text-center mb-10 md:mb-12">
        {t('title')}
      </h2>

      <div className="border-t border-line">
        {items.map((item) => (
          <details key={item.key} className="group border-b border-line">
            <summary className="flex items-start justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="text-body font-medium text-ink">{t(`items.${item.key}.question`)}</h3>
              <Plus
                size={17}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mt-1 shrink-0 text-ink-tertiary transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            <p className="t-small pb-6 pe-10 max-w-2xl">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
