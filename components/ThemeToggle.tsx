'use client';

import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { IconButton } from './ui/IconButton';
import { cn } from '@/lib/utils/cn';

/** Header icon button: shows the theme you would switch *to*. */
export default function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <IconButton
      label={dark ? t('light') : t('dark')}
      aria-pressed={dark}
      onClick={toggle}
      className={cn('text-ink-secondary hover:text-ink', className)}
    >
      {dark ? (
        <Sun size={19} strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Moon size={19} strokeWidth={1.6} aria-hidden="true" />
      )}
    </IconButton>
  );
}

/** Two-option segmented control for menus and the account sheet. */
export function ThemeSegmented() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: t('lightShort'), Icon: Sun },
    { value: 'dark' as const, label: t('darkShort'), Icon: Moon },
  ];

  return (
    <div role="radiogroup" aria-label={t('label')} className="grid grid-cols-2 gap-1 p-1 rounded-md bg-surface-sunken">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex items-center justify-center gap-2 h-10 rounded-sm text-small transition-colors',
            theme === value ? 'bg-surface text-ink shadow-xs font-medium' : 'text-ink-secondary hover:text-ink'
          )}
        >
          <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
