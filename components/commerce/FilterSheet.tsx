'use client';

import { useTranslations } from 'next-intl';
import type { CategoryWithDetails, Locale } from '@/lib/types/database';
import Drawer from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import CategoryFilter from './CategoryFilter';
import SortSelect, { type SortOption } from './SortSelect';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithDetails[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  locale: Locale;
  resultCount: number;
}

/** Mobile counterpart of the desktop filter rail — same controls, same state. */
export default function FilterSheet({
  open,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  sort,
  onSortChange,
  locale,
  resultCount,
}: FilterSheetProps) {
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('filters')}
      closeLabel={tCommon('close')}
      side="bottom"
      footer={
        <div className="p-5">
          <Button fullWidth size="lg" onClick={onClose}>
            {t('showResults', { count: resultCount })}
          </Button>
        </div>
      }
    >
      <div className="p-5 space-y-8">
        <div>
          <h3 className="t-label mb-4">{t('filter')}</h3>
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            locale={locale}
          />
        </div>

        <div>
          <h3 className="t-label mb-4">{t('sort')}</h3>
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
      </div>
    </Drawer>
  );
}
