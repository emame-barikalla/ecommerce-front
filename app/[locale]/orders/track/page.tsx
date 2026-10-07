'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const STEPS = ['received', 'packed', 'shipped', 'delivered'] as const;

/**
 * Orders are placed and fulfilled over WhatsApp, so there is no order table to
 * query. This page validates the reference format and hands the shopper to the
 * conversation that actually holds their status — it never invents one.
 */
export default function OrderTrackingPage() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { whatsappNumber } = useStoreSettings();

  const [orderRef, setOrderRef] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const trimmed = orderRef.trim().toUpperCase();
  const isValidRef = /^ORD-[A-Z0-9]+-[A-Z0-9]+$/.test(trimmed);

  return (
    <div className="container-narrow py-16 md:py-24">
      <div className="max-w-lg">
        <p className="t-label mb-5">{t('eyebrow')}</p>
        <h1 className="t-h1">{t('trackTitle')}</h1>
        <p className="t-body mt-4">{t('trackDescription')}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="mt-10 max-w-md"
      >
        <label htmlFor="order-ref" className="block text-small font-medium text-ink mb-2">
          {t('orderRef')}
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Input
            id="order-ref"
            type="text"
            value={orderRef}
            onChange={(e) => {
              setOrderRef(e.target.value);
              setSubmitted(false);
            }}
            placeholder="ORD-XXXXX-XXXX"
            className="sm:flex-1 tabular"
            aria-describedby="track-result"
          />
          <Button type="submit" className="shrink-0">
            {t('track')}
          </Button>
        </div>
      </form>

      <div id="track-result" aria-live="polite" className="mt-10 max-w-md">
        {submitted && !isValidRef && (
          <p className="text-small text-error">{t('invalidRef')}</p>
        )}

        {submitted && isValidRef && (
          <div className="animate-fade-in border border-line rounded-lg p-6">
            <div className="flex items-start gap-3">
              <PackageSearch
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ink-tertiary"
              />
              <div>
                <h2 className="text-body font-medium text-ink tabular">{trimmed}</h2>
                <p className="t-small mt-2">{t('checkOnWhatsApp')}</p>
              </div>
            </div>

            <ol className="mt-7 space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-small text-ink-secondary">
                  <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full border border-line text-caption tabular text-ink-tertiary">
                    {i + 1}
                  </span>
                  {t(`status.${step}`)}
                </li>
              ))}
            </ol>

            {whatsappNumber && (
              <a
                href={buildWhatsAppUrl(whatsappNumber, t('whatsappMessage', { ref: trimmed }))}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: 'whatsapp', fullWidth: true, className: 'mt-7' })}
              >
                {t('askStatus')}
              </a>
            )}
          </div>
        )}
      </div>

      <p className="mt-10 text-small text-ink-tertiary">
        {t.rich('lostRef', {
          link: (chunks) => (
            <Link href={`/${locale}/contact`} className="text-ink underline underline-offset-4 hover:no-underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
