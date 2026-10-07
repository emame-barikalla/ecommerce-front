'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Compass } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations('notFound');

  return (
    <div className="container-page min-h-[60vh] grid place-items-center">
      <EmptyState
        icon={Compass}
        title={t('title')}
        description={t('description')}
        action={
          <Link href={`/${locale}`} className={buttonStyles()}>
            {t('goHome')}
          </Link>
        }
        secondaryAction={
          <Link href={`/${locale}/catalog`} className={buttonStyles({ variant: 'outline' })}>
            {t('browseCatalog')}
          </Link>
        }
      />
    </div>
  );
}
