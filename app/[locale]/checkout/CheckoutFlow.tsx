'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Check, CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/lib/context/CartContext';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { cartProductName, type CartItem } from '@/lib/hooks/useCart';
import { generateOrderId, openWhatsApp } from '@/lib/utils/whatsapp';
import { SITE_URL } from '@/lib/config';
import type { Locale } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';
import { CartLine } from '@/components/Cart';
import EmptyState from '@/components/ui/EmptyState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { formatPrice } from '@/components/ui/Price';
import { Skeleton } from '@/components/ui/Skeleton';

type Step = 'review' | 'details' | 'confirm' | 'sent' | 'done';
const STEPS = ['review', 'details', 'confirm'] as const;

interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  note: string;
}

const EMPTY_CUSTOMER: Customer = { name: '', phone: '', city: '', address: '', note: '' };
/** Remembered on this device only, so a returning customer does not retype. */
const CUSTOMER_KEY = 'checkout_customer_v1';

type Errors = Partial<Record<keyof Customer, string>>;

export default function CheckoutFlow() {
  const t = useTranslations('checkout');
  const locale = useLocale() as Locale;
  const settings = useStoreSettings();
  const { cart, isLoaded, issues, orderableItems, subtotal, refresh, clearCart, removeFromCart, updateQuantity } =
    useCartContext();

  const [step, setStep] = useState<Step>('review');
  const [check, setCheck] = useState<'checking' | 'ok' | 'failed'>('checking');
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Errors>({});
  const [orderRef, setOrderRef] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const runCheck = useCallback(async () => {
    setCheck('checking');
    setCheck((await refresh()) === null ? 'failed' : 'ok');
  }, [refresh]);

  // Prices and availability are re-read before anything else happens.
  useEffect(() => {
    if (isLoaded) void runCheck();
    // Only once the stored cart is available; later edits don't need a recheck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_KEY);
      if (stored) setCustomer({ ...EMPTY_CUSTOMER, ...JSON.parse(stored), note: '' });
    } catch {
      // Ignore unreadable storage — the form simply starts empty.
    }
  }, []);

  const goTo = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0 });
    // Move focus to the new step's heading so screen readers announce it.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const freeDelivery =
    settings.freeDeliveryThreshold !== null && subtotal >= settings.freeDeliveryThreshold;

  const buildMessage = (ref: string) => {
    const lines = [
      t('message.greeting'),
      '',
      t('message.ref', { ref }),
      '',
      t('message.items'),
      ...orderableItems.map(
        (item) =>
          `${t('message.line', {
            name: cartProductName(item.product, locale),
            quantity: item.quantity,
            total: formatPrice(item.product.price * item.quantity),
          })}\n  ${SITE_URL}/${locale}/catalog/${item.product.slug}`
      ),
      '',
      t('message.subtotal', { amount: formatPrice(subtotal) }),
      freeDelivery ? t('message.deliveryFree') : t('message.deliveryPending'),
      '',
      t('message.customer'),
      t('message.name', { value: customer.name.trim() }),
      t('message.phone', { value: customer.phone.trim() }),
      t('message.city', { value: customer.city.trim() }),
      customer.address.trim() ? t('message.address', { value: customer.address.trim() }) : null,
      customer.note.trim() ? t('message.note', { value: customer.note.trim() }) : null,
      '',
      t('message.closing'),
    ];
    return lines.filter((l): l is string => l !== null).join('\n');
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!customer.name.trim()) next.name = t('errors.required');
    const digits = customer.phone.replace(/\D/g, '');
    if (!customer.phone.trim()) next.phone = t('errors.required');
    else if (digits.length < 8 || digits.length > 15) next.phone = t('errors.phone');
    if (!customer.city.trim()) next.city = t('errors.required');
    return next;
  };

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Send focus to the first invalid field.
      const first = (['name', 'phone', 'city'] as const).find((k) => found[k]);
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    try {
      const { note: _note, ...remembered } = customer;
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(remembered));
    } catch {
      // Not remembering the details is fine.
    }
    goTo('confirm');
  };

  const send = () => {
    if (!settings.whatsappNumber) return;
    const ref = orderRef || generateOrderId();
    setOrderRef(ref);
    openWhatsApp(settings.whatsappNumber, buildMessage(ref));
    goTo('sent');
  };

  const setField = (key: keyof Customer) => (e: { target: { value: string } }) => {
    setCustomer((c) => ({ ...c, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ------------------------------------------------------------------ states

  if (!isLoaded) {
    return (
      <div className="container-page py-12 grid lg:grid-cols-[1fr_22rem] gap-10" aria-hidden="true">
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="container-narrow py-16">
        <EmptyState
          icon={CheckCircle2}
          title={t('doneTitle')}
          description={t('doneDescription', { ref: orderRef })}
          action={
            <Link href={`/${locale}/catalog`} className={buttonStyles()}>
              {t('continueShopping')}
            </Link>
          }
          secondaryAction={
            <Link href={`/${locale}/orders/track`} className={buttonStyles({ variant: 'outline' })}>
              {t('trackOrder')}
            </Link>
          }
        />
      </div>
    );
  }

  if (cart.length === 0 && step !== 'sent') {
    return (
      <div className="container-narrow py-16">
        <EmptyState
          icon={ShoppingBag}
          title={t('empty')}
          description={t('emptyHint')}
          action={
            <Link href={`/${locale}/catalog`} className={buttonStyles()}>
              {t('continueShopping')}
            </Link>
          }
        />
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);
  const hasUnavailable = Object.values(issues).includes('unavailable');
  const hasPriceChange = Object.values(issues).includes('priceChanged');
  const canProceed = check === 'ok' && orderableItems.length > 0;

  return (
    <div className="container-page pt-8 pb-section">
      {step !== 'sent' && (
        <nav aria-label={t('progress')} className="mb-8 md:mb-10">
          <ol className="flex items-center gap-2 text-caption">
            {STEPS.map((s, i) => {
              const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo';
              return (
                <li key={s} className="flex items-center gap-2 min-w-0" aria-current={state === 'current' ? 'step' : undefined}>
                  <span
                    className={cn(
                      'grid place-items-center w-6 h-6 shrink-0 rounded-full tabular font-medium',
                      state === 'todo' ? 'border border-line-strong text-ink-tertiary' : 'bg-ink text-ink-inverse'
                    )}
                  >
                    {state === 'done' ? <Check size={12} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn('truncate', state === 'todo' ? 'text-ink-tertiary' : 'text-ink font-medium')}>
                    {t(`steps.${s}`)}
                  </span>
                  {i < STEPS.length - 1 && <span aria-hidden="true" className="w-6 sm:w-10 h-px bg-line-strong mx-1" />}
                </li>
              );
            })}
          </ol>
          <p className="sr-only">{t('stepOf', { current: stepIndex + 1, total: STEPS.length })}</p>
        </nav>
      )}

      <div className="grid lg:grid-cols-[1fr_22rem] gap-x-14 gap-y-10 items-start">
        <section aria-labelledby="checkout-step-heading" className="min-w-0">
          {/* ------------------------------------------------------ REVIEW */}
          {step === 'review' && (
            <>
              <StepHeading ref={headingRef}>{t('reviewTitle')}</StepHeading>
              <CheckStatus
                check={check}
                hasUnavailable={hasUnavailable}
                hasPriceChange={hasPriceChange}
                nothingOrderable={check === 'ok' && orderableItems.length === 0}
                onRetry={runCheck}
              />
              <ul className="divide-y divide-line border-y border-line">
                {cart.map((item) => (
                  <CartLine
                    key={item.product.id}
                    item={item}
                    issue={issues[item.product.id]}
                    locale={locale}
                    onRemove={() => removeFromCart(item.product.id)}
                    onQuantity={(q) => updateQuantity(item.product.id, q)}
                  />
                ))}
              </ul>
              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'ghost' })}>
                  {t('continueShopping')}
                </Link>
                <Button size="lg" disabled={!canProceed} onClick={() => goTo('details')}>
                  {t('continue')}
                </Button>
              </div>
            </>
          )}

          {/* ----------------------------------------------------- DETAILS */}
          {step === 'details' && (
            <form onSubmit={submitDetails} noValidate>
              <StepHeading ref={headingRef}>{t('detailsTitle')}</StepHeading>
              <p className="t-small -mt-3 mb-7">{t('detailsHint')}</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={t('fields.name')} error={errors.name} required>
                  <Input name="name" autoComplete="name" value={customer.name} onChange={setField('name')} />
                </Field>
                <Field label={t('fields.phone')} hint={t('fields.phoneHint')} error={errors.phone} required>
                  <Input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    value={customer.phone}
                    onChange={setField('phone')}
                    className="rtl:text-right"
                  />
                </Field>
                <Field label={t('fields.city')} error={errors.city} required>
                  <Input
                    name="city"
                    autoComplete="address-level2"
                    value={customer.city}
                    onChange={setField('city')}
                  />
                </Field>
                <Field label={t('fields.address')} hint={t('fields.addressHint')}>
                  <Input
                    name="address"
                    autoComplete="street-address"
                    value={customer.address}
                    onChange={setField('address')}
                  />
                </Field>
                <Field label={t('fields.note')} className="sm:col-span-2">
                  <Textarea
                    name="note"
                    rows={3}
                    maxLength={500}
                    placeholder={t('fields.notePlaceholder')}
                    value={customer.note}
                    onChange={setField('note')}
                  />
                </Field>
              </div>
              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => goTo('review')}>
                  {t('back')}
                </Button>
                <Button type="submit" size="lg">
                  {t('continue')}
                </Button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------- CONFIRM */}
          {step === 'confirm' && (
            <>
              <StepHeading ref={headingRef}>{t('confirmTitle')}</StepHeading>

              <div className="rounded-lg border border-line p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-small font-medium text-ink">{t('summary.deliverTo')}</h3>
                  <button
                    type="button"
                    onClick={() => goTo('details')}
                    className="text-small text-ink underline underline-offset-4 hover:no-underline"
                  >
                    {t('edit')}
                  </button>
                </div>
                <address className="mt-2 not-italic t-small space-y-0.5">
                  <p className="text-ink">{customer.name}</p>
                  <p dir="ltr" className="rtl:text-right">
                    {customer.phone}
                  </p>
                  <p>{[customer.address, customer.city].filter((v) => v.trim()).join(', ')}</p>
                  {customer.note.trim() && <p className="pt-2 whitespace-pre-line">{customer.note}</p>}
                </address>
              </div>

              <p className="mt-6 flex gap-3 rounded-lg bg-surface-subtle p-4 t-small">
                <MessageCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-tertiary" />
                {t('sendNotice')}
              </p>

              {!settings.whatsappNumber && (
                <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-error/30 bg-error-subtle p-4">
                  <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-error" />
                  <div className="t-small">
                    <p className="font-medium text-ink">{t('whatsappMissingTitle')}</p>
                    <p className="mt-1">{t('whatsappMissingDescription')}</p>
                    <Link href={`/${locale}/contact`} className="inline-block mt-2 text-ink underline underline-offset-4">
                      {t('contactUs')}
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => goTo('details')}>
                  {t('back')}
                </Button>
                <Button
                  variant="whatsapp"
                  size="lg"
                  onClick={send}
                  disabled={!settings.whatsappNumber || orderableItems.length === 0}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  {t('send')}
                </Button>
              </div>
            </>
          )}

          {/* -------------------------------------------------------- SENT */}
          {step === 'sent' && (
            <div className="max-w-lg">
              <StepHeading ref={headingRef}>{t('sentTitle')}</StepHeading>
              <p className="t-body">{t('sentDescription')}</p>
              <p className="mt-6 text-small text-ink-secondary">
                {t('orderRef')}:{' '}
                <bdi className="font-medium text-ink tabular">{orderRef}</bdi>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    clearCart();
                    goTo('done');
                  }}
                >
                  {t('sentConfirm')}
                </Button>
                <Button size="lg" variant="outline" onClick={send}>
                  {t('reopen')}
                </Button>
              </div>
            </div>
          )}
        </section>

        {step !== 'sent' && (
          <OrderSummary items={orderableItems} subtotal={subtotal} freeDelivery={freeDelivery} locale={locale} />
        )}
      </div>
    </div>
  );
}

const StepHeading = forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(({ children }, ref) => (
  <h1 id="checkout-step-heading" ref={ref} tabIndex={-1} className="t-h2 mb-6 outline-none">
    {children}
  </h1>
));
StepHeading.displayName = 'StepHeading';

function CheckStatus({
  check,
  hasUnavailable,
  hasPriceChange,
  nothingOrderable,
  onRetry,
}: {
  check: 'checking' | 'ok' | 'failed';
  hasUnavailable: boolean;
  hasPriceChange: boolean;
  nothingOrderable: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('checkout');
  const notices: Array<{ tone: 'error' | 'info'; text: string }> = [];
  if (check === 'failed') notices.push({ tone: 'error', text: t('checkFailed') });
  if (nothingOrderable) notices.push({ tone: 'error', text: t('nothingOrderable') });
  else if (hasUnavailable) notices.push({ tone: 'error', text: t('unavailableNotice') });
  if (hasPriceChange) notices.push({ tone: 'info', text: t('priceNotice') });

  return (
    <div aria-live="polite" className="space-y-3 mb-6 empty:hidden">
      {check === 'checking' && <p className="t-small">{t('checking')}</p>}
      {notices.map((n) => (
        <div
          key={n.text}
          className={cn(
            'flex items-start gap-3 rounded-lg p-4 t-small',
            n.tone === 'error' ? 'bg-error-subtle' : 'bg-accent-subtle'
          )}
        >
          <AlertCircle
            size={16}
            aria-hidden="true"
            className={cn('mt-0.5 shrink-0', n.tone === 'error' ? 'text-error' : 'text-accent')}
          />
          <p className="flex-1 text-ink">{n.text}</p>
          {check === 'failed' && n.tone === 'error' && (
            <button type="button" onClick={onRetry} className="text-ink underline underline-offset-4 shrink-0">
              {t('retry')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  freeDelivery,
  locale,
}: {
  items: CartItem[];
  subtotal: number;
  freeDelivery: boolean;
  locale: Locale;
}) {
  const t = useTranslations('checkout');
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <aside
      aria-labelledby="order-summary-heading"
      className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] rounded-lg bg-surface-subtle border border-line p-5 md:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="order-summary-heading" className="text-body font-medium text-ink">
          {t('summary.title')}
        </h2>
        <span className="text-caption text-ink-tertiary">{t('summary.items', { count })}</span>
      </div>

      <ul className="mt-4 space-y-2 text-small">
        {items.map((item) => (
          <li key={item.product.id} className="flex justify-between gap-4">
            <span className="text-ink-secondary min-w-0 truncate">
              {cartProductName(item.product, locale)} <bdi className="tabular">× {item.quantity}</bdi>
            </span>
            <span className="tabular text-ink shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 pt-5 border-t border-line space-y-2 text-small">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-secondary">{t('summary.subtotal')}</dt>
          <dd className="tabular text-ink">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-secondary">{t('summary.delivery')}</dt>
          <dd className={freeDelivery ? 'text-success font-medium' : 'text-ink-secondary'}>
            {freeDelivery ? t('summary.deliveryFree') : t('summary.deliveryConfirmed')}
          </dd>
        </div>
      </dl>

      <div className="mt-4 pt-4 border-t border-line flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{t('summary.total')}</span>
        <span className="text-xl font-medium tabular text-ink">{formatPrice(subtotal)}</span>
      </div>
    </aside>
  );
}
