import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

const variants = {
  ghost: 'text-ink hover:bg-surface-sunken',
  subtle: 'text-ink-secondary hover:text-ink hover:bg-surface-sunken',
  outline: 'border border-line text-ink hover:border-ink',
  /** Floating over imagery. */
  overlay: 'bg-white/90 text-ink hover:bg-white shadow-xs',
  danger: 'text-ink-tertiary hover:text-error hover:bg-error-subtle',
};

// `md` is the 44px touch-target default; `sm` is for dense desktop-only rows.
const sizes = { sm: 'w-9 h-9', md: 'w-11 h-11' };

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only button has no other accessible name. */
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = 'ghost', size = 'md', className, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-grid place-items-center shrink-0 rounded-md transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
