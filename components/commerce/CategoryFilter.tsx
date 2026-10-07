'use client';

import { useTranslations } from 'next-intl';
import type { CategoryWithDetails, Locale } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface CategoryFilterProps {
  categories: CategoryWithDetails[];
  selected: string;
  onChange: (slug: string) => void;
  locale: Locale;
  /** `list` stacks (sidebar / sheet); `rail` scrolls horizontally. */
  layout?: 'list' | 'rail';
}

export default function CategoryFilter({
  categories,
  selected,
  onChange,
  locale,
  layout = 'list',
}: CategoryFilterProps) {
  const t = useTranslations('catalog');

  const options = [
    { slug: 'all', name: t('all') },
    ...categories.map((cat) => ({
      slug: cat.slug,
      name: cat.translations[locale]?.name || cat.translations.en?.name || cat.slug,
    })),
  ];

  if (layout === 'rail') {
    return (
      <div
        role="group"
        aria-label={t('filter')}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0"
      >
        {options.map((o) => (
          <button
            key={o.slug}
            onClick={() => onChange(o.slug)}
            aria-pressed={selected === o.slug}
            className={cn(
              'shrink-0 h-9 px-4 rounded-full text-small border transition-colors',
              selected === o.slug
                ? 'bg-ink text-ink-inverse border-ink'
                : 'bg-white text-ink-secondary border-line hover:border-ink hover:text-ink'
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <ul role="group" aria-label={t('filter')} className="space-y-0.5">
      {options.map((o) => (
        <li key={o.slug}>
          <button
            onClick={() => onChange(o.slug)}
            aria-pressed={selected === o.slug}
            className={cn(
              'w-full text-start py-2 text-sm transition-colors',
              selected === o.slug
                ? 'text-ink font-medium'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            {o.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
