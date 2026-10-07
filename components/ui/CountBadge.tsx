import { cn } from '@/lib/utils/cn';

/**
 * Small numeric bubble for cart / favorites icons. Decorative: the parent's
 * accessible name already carries the count. Re-keyed on change so it pops.
 */
export default function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      aria-hidden="true"
      className={cn(
        'absolute grid place-items-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full',
        'bg-brand text-ink-inverse text-micro font-semibold tabular ring-2 ring-[rgb(var(--surface-rgb))] animate-pop',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
