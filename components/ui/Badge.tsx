import { cn } from '@/lib/utils/cn';
import { HTMLAttributes } from 'react';

const variants = {
  neutral: 'bg-surface-sunken text-ink-secondary',
  outline: 'bg-surface/90 text-ink border border-line backdrop-blur-sm',
  /** Reserved for markdowns — the only place loud red is allowed. */
  sale: 'bg-sale text-white',
  new: 'bg-ink text-ink-inverse',
  brand: 'bg-brand-subtle text-brand',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2 py-1',
        'text-caption font-medium uppercase tracking-[0.06em] leading-none whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
