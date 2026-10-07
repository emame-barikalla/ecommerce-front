'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Input';

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export const SORT_OPTIONS: SortOption[] = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'name',
];

const LABEL_KEY: Record<SortOption, string> = {
  featured: 'sortFeatured',
  newest: 'sortNewest',
  'price-asc': 'sortPriceAsc',
  'price-desc': 'sortPriceDesc',
  name: 'sortName',
};

export function isSortOption(value: string | null): value is SortOption {
  return !!value && (SORT_OPTIONS as string[]).includes(value);
}

export default function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortOption;
  onChange: (next: SortOption) => void;
  className?: string;
}) {
  const t = useTranslations('catalog');
  // Mounted twice on the catalog (desktop toolbar + mobile sheet).
  const id = useId();

  return (
    <>
      <label htmlFor={id} className="sr-only">
        {t('sort')}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className={className}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(LABEL_KEY[option])}
          </option>
        ))}
      </Select>
    </>
  );
}
