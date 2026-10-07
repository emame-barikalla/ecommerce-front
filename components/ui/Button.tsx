import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const variants = {
  /** The dominant purchase CTA. Ink, not colour — it reads as expensive. */
  primary: 'bg-ink text-ink-inverse hover:bg-[var(--cta-hover)]',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-surface-subtle',
  outline: 'bg-transparent text-ink border border-line hover:border-ink',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink',
  brand: 'bg-brand text-white hover:bg-brand-hover',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-hover',
  /** For placement on imagery or dark panels. */
  inverse: 'bg-white text-ink hover:bg-surface-subtle',
  /** Secondary action on imagery or dark panels. */
  outlineInverse: 'bg-ink/20 text-white border border-white/70 hover:border-white hover:bg-white/10',
  danger: 'bg-error text-white hover:brightness-110',
};

const sizes = {
  sm: 'h-9 px-4 text-small gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-[3.25rem] px-8 text-body gap-2.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium leading-none',
        'transition-[background-color,border-color,color,opacity] duration-200',
        'active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

/** Same visual language for `next/link` and `<a>`. */
export const buttonStyles = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  className?: string;
} = {}) =>
  cn(
    'inline-flex items-center justify-center rounded-md font-medium leading-none',
    'transition-[background-color,border-color,color,opacity] duration-200 active:scale-[0.98]',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );
