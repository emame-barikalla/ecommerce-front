'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';

export default function ContactForm() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!response.ok) throw new Error(`contact: ${response.status}`);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      // Keep the message generic — WhatsApp is offered as the fallback.
      setStatus('error');
    }
  };

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={t('name')} required>
          <Input
            type="text"
            autoComplete="name"
            maxLength={120}
            value={form.name}
            onChange={set('name')}
            placeholder={t('namePlaceholder')}
          />
        </Field>
        <Field label={t('email')}>
          <Input
            type="email"
            autoComplete="email"
            dir="ltr"
            value={form.email}
            onChange={set('email')}
            placeholder={t('emailPlaceholder')}
            className="rtl:text-right"
          />
        </Field>
      </div>

      <Field label={t('message')} required>
        <Textarea
          rows={6}
          maxLength={4000}
          value={form.message}
          onChange={set('message')}
          placeholder={t('messagePlaceholder')}
        />
      </Field>

      <Button type="submit" size="lg" disabled={status === 'loading'}>
        {status === 'loading' ? t('sending') : t('send')}
      </Button>

      <div aria-live="polite" aria-atomic="true" className="min-h-[1.5rem]">
        {status === 'success' && (
          <p className="flex items-center gap-2 text-small text-success">
            <Check size={15} aria-hidden="true" />
            {t('success')}
          </p>
        )}
        {status === 'error' && (
          <p className="flex items-center gap-2 text-small text-error">
            <AlertCircle size={15} aria-hidden="true" />
            {t('error')}
          </p>
        )}
      </div>
    </form>
  );
}
