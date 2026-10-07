'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import WithSearchParams from './WithSearchParams';

interface SearchBarProps {
  /** `bar` is always-visible; `expand` grows from a compact field on focus. */
  variant?: 'bar' | 'expand';
  autoFocus?: boolean;
  onSubmitted?: () => void;
  className?: string;
}

/**
 * Search is a navigation, not local state: it pushes `?q=` onto the catalog so
 * results are linkable, shareable and survive a language switch. On the
 * catalog the field mirrors the current query and keeps the other filters.
 */
export default function SearchBar(props: SearchBarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const onCatalog = pathname === `/${locale}/catalog`;

  return (
    <WithSearchParams
      render={(params) => {
        const query = onCatalog ? params.get('q') ?? '' : '';
        // Keyed on the query so the field resets when the URL changes.
        return <SearchForm key={query} {...props} initialQuery={query} catalogParams={onCatalog ? params : null} />;
      }}
    />
  );
}

function SearchForm({
  variant = 'bar',
  autoFocus,
  onSubmitted,
  className,
  initialQuery,
  catalogParams,
}: SearchBarProps & { initialQuery: string; catalogParams: URLSearchParams | null }) {
  const t = useTranslations('catalog');
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  // Several search bars can be mounted at once (header + mobile row).
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(catalogParams?.toString() ?? '');
    const q = value.trim();
    if (q) next.set('q', q);
    else next.delete('q');
    const qs = next.toString();
    router.push(`/${locale}/catalog${qs ? `?${qs}` : ''}`);
    inputRef.current?.blur();
    onSubmitted?.();
  };

  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {t('searchPlaceholder')}
      </label>
      <Search
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
      />
      <input
        id={id}
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className={cn(
          'field ps-9 pe-10 h-11 lg:h-10 rounded-md bg-surface-subtle border-transparent hover:border-line',
          'focus:bg-white [&::-webkit-search-cancel-button]:hidden',
          variant === 'expand' && 'w-48 focus:w-64 transition-[width] duration-300 ease-out'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            inputRef.current?.focus();
          }}
          aria-label={t('clearSearch')}
          className="absolute end-1 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-xs text-ink-tertiary hover:text-ink transition-colors"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
