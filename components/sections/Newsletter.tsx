'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Newsletter() {
  const t = useTranslations('home.newsletter');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t('error'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('request failed');
      toast.success(t('success'));
      setEmail('');
    } catch {
      // Never surface the transport error — it tells the shopper nothing useful.
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="newsletter-heading" className="container-page">
      <div className="max-w-xl">
        <h2 id="newsletter-heading" className="t-h3">
          {t('title')}
        </h2>
        <p className="t-small mt-2">{t('description')}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <label htmlFor="newsletter-email" className="sr-only">
            {t('placeholder')}
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            required
            className="sm:flex-1 h-11"
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? t('submitting') : t('button')}
          </Button>
        </form>
      </div>
    </section>
  );
}
