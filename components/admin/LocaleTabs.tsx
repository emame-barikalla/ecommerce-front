'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { LOCALES } from '@/lib/config';
import { LOCALE_LABELS } from '@/lib/admin/labels';
import type { Locale } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface LocaleTabsProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  /** Locales still missing required content — flagged with a dot. */
  incomplete?: Locale[];
  children: (locale: Locale) => ReactNode;
}

/**
 * Tabs for per-language fields, following the ARIA tabs pattern (arrow keys
 * move between tabs). The Arabic panel renders right-to-left.
 */
export default function LocaleTabs({ value, onChange, incomplete = [], children }: LocaleTabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent) => {
    const index = LOCALES.indexOf(value);
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = LOCALES[(index + delta + LOCALES.length) % LOCALES.length];
    onChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Langue" className="flex gap-1 border-b border-line" onKeyDown={onKeyDown}>
        {LOCALES.map((locale) => {
          const selected = locale === value;
          return (
            <button
              key={locale}
              ref={(el) => {
                tabRefs.current[locale] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${locale}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(locale)}
              className={cn(
                'relative flex items-center gap-2 h-11 px-4 -mb-px text-sm border-b-2 transition-colors',
                selected ? 'border-ink text-ink font-medium' : 'border-transparent text-ink-secondary hover:text-ink'
              )}
            >
              {LOCALE_LABELS[locale]}
              {incomplete.includes(locale) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-label="(incomplet)" />
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${value}`}
        dir={value === 'ar' ? 'rtl' : 'ltr'}
        lang={value}
        className="pt-5"
      >
        {children(value)}
      </div>
    </div>
  );
}
