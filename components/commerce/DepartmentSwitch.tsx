'use client';

import { useTranslations } from 'next-intl';
import { DEPARTMENTS, type Department } from '@/lib/store/departments';
import { cn } from '@/lib/utils/cn';

/** All / Women / Men — the catalog's primary filter, as a segmented control. */
export default function DepartmentSwitch({
  value,
  onChange,
  className,
}: {
  value: Department | null;
  onChange: (next: Department | null) => void;
  className?: string;
}) {
  const t = useTranslations('nav');
  const options: Array<{ value: Department | null; label: string }> = [
    { value: null, label: t('all') },
    ...DEPARTMENTS.map((d) => ({ value: d, label: t(d) })),
  ];

  return (
    <div
      role="group"
      aria-label={t('departments')}
      className={cn('inline-flex p-1 rounded-full bg-surface-sunken border border-line', className)}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value ?? 'all'}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              'h-9 px-5 rounded-full text-small transition-colors',
              active ? 'bg-ink text-ink-inverse font-medium shadow-xs' : 'text-ink-secondary hover:text-ink'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
