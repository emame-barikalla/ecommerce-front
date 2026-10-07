'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}

const sizes = {
  sm: { button: 'w-9 h-9', value: 'w-8 text-small', icon: 13 },
  md: { button: 'w-11 h-11', value: 'w-12 text-body', icon: 15 },
};

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  decreaseLabel,
  increaseLabel,
  className,
}: QuantityStepperProps) {
  const s = sizes[size];

  return (
    <div
      className={cn('inline-flex items-center rounded-md border border-line bg-white', className)}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decreaseLabel}
        className={cn(
          s.button,
          'grid place-items-center text-ink-secondary rounded-s-md transition-colors',
          'hover:text-ink hover:bg-surface-sunken disabled:opacity-30 disabled:pointer-events-none'
        )}
      >
        <Minus size={s.icon} aria-hidden="true" />
      </button>

      {/* aria-live keeps screen readers informed without an extra announcement region */}
      <span
        aria-live="polite"
        className={cn(s.value, 'text-center font-medium tabular text-ink select-none')}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={increaseLabel}
        className={cn(
          s.button,
          'grid place-items-center text-ink-secondary rounded-e-md transition-colors',
          'hover:text-ink hover:bg-surface-sunken disabled:opacity-30 disabled:pointer-events-none'
        )}
      >
        <Plus size={s.icon} aria-hidden="true" />
      </button>
    </div>
  );
}
