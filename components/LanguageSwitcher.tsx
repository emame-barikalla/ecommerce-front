'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { LOCALE_OPTIONS } from '@/lib/config';
import WithSearchParams, { localeHref } from './WithSearchParams';

/**
 * Desktop language menu. Options are real links (with `hreflang`) that keep
 * the current path and query, so a filtered catalog survives the switch. A
 * disclosure pattern rather than an ARIA menu keeps plain Tab navigation.
 */
export default function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = LOCALE_OPTIONS.find((l) => l.code === locale) ?? LOCALE_OPTIONS[0];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('language')}: ${current.label}`}
        className="inline-flex items-center gap-1.5 h-11 px-2.5 rounded-md text-small font-medium text-ink-secondary hover:text-ink hover:bg-surface-sunken transition-colors"
      >
        <Globe size={16} aria-hidden="true" strokeWidth={1.75} />
        <span aria-hidden="true">{current.short}</span>
      </button>

      {open && (
        <ul
          id={listId}
          className="absolute end-0 top-full mt-1 min-w-[10rem] rounded-lg border border-line bg-white shadow-lg p-1 z-drawer animate-fade-in"
        >
          <WithSearchParams
            render={(params) =>
              LOCALE_OPTIONS.map((l) => (
                <li key={l.code}>
                  <Link
                    href={localeHref(pathname, params, l.code)}
                    hrefLang={l.code}
                    lang={l.code}
                    onClick={() => setOpen(false)}
                    aria-current={locale === l.code ? 'true' : undefined}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm text-sm text-ink hover:bg-surface-sunken transition-colors"
                  >
                    {l.label}
                    {locale === l.code && <Check size={14} aria-hidden="true" className="text-brand" />}
                  </Link>
                </li>
              ))
            }
          />
        </ul>
      )}
    </div>
  );
}
