import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * The chevron is mirrored under RTL so the trail still reads outward from the
 * site root rather than pointing back into it.
 */
export default function Breadcrumb({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-small text-ink-tertiary overflow-x-auto no-scrollbar whitespace-nowrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-ink transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink truncate max-w-[16rem]" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight size={13} aria-hidden="true" className="shrink-0 rtl:-scale-x-100 text-ink-tertiary" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
