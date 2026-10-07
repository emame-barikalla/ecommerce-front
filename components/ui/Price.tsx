import { cn } from '@/lib/utils/cn';
import { CURRENCY } from '@/lib/config';

/**
 * Clean MRU prices: `1500 MRU`, never `1,500.00 MRU`. Decimals appear only
 * when a price really has them (`99.50 MRU`). Amounts of five digits and up
 * are grouped with a narrow space (`12 500 MRU`) so they stay scannable.
 * Arabic renders Western digits deliberately — Mauritanian storefronts price
 * in Western numerals.
 *
 * Wrapped in invisible Unicode isolates (LRI … PDI): inside Arabic text the
 * bidi algorithm would otherwise reorder it to "MRU 1500". This works in
 * every context, including plain-text WhatsApp messages and toasts.
 */
export function formatPrice(value: number): string {
  const whole = Math.round(value * 100) % 100 === 0;
  const amount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
    useGrouping: Math.abs(value) >= 10_000,
  })
    .format(value)
    .replace(/,/g, ' ');
  return `⁦${amount} ${CURRENCY}⁩`;
}

/** Whole-percent markdown, or `null` when the item is not on sale. */
export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (typeof compareAt !== 'number' || compareAt <= price) return null;
  const pct = Math.round((1 - price / compareAt) * 100);
  return pct > 0 ? pct : null;
}

interface PriceProps {
  value: number;
  /** Original price when the item is marked down. */
  compareAt?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { current: 'text-small', compare: 'text-caption' },
  md: { current: 'text-base', compare: 'text-small' },
  lg: { current: 'text-2xl md:text-[1.75rem]', compare: 'text-base' },
};

export default function Price({ value, compareAt, size = 'md', className }: PriceProps) {
  const onSale = discountPercent(value, compareAt) !== null;
  const s = sizes[size];

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2.5 tabular', className)}>
      {/* <bdi> keeps "1500 MRU" in one piece inside Arabic text */}
      <bdi className={cn('font-semibold', s.current, onSale ? 'text-sale' : 'text-ink')}>{formatPrice(value)}</bdi>
      {onSale && (
        <s className={cn('text-ink-tertiary', s.compare)}>
          <bdi>{formatPrice(compareAt as number)}</bdi>
        </s>
      )}
    </p>
  );
}
