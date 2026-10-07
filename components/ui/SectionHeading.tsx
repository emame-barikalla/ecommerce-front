import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SectionHeadingProps {
  /** Small uppercase kicker above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional "view all"-style link aligned to the far edge. */
  action?: { label: string; href: string };
  align?: 'start' | 'center';
  className?: string;
  as?: 'h2' | 'h3';
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'start',
  className,
  as: Heading = 'h2',
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 mb-10 md:mb-14',
        align === 'start'
          ? 'sm:flex-row sm:items-end sm:justify-between'
          : 'items-center text-center',
        className
      )}
    >
      <div className={cn('max-w-xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="t-label mb-3">{eyebrow}</p>}
        <Heading className="t-h2">{title}</Heading>
        {description && <p className="t-body mt-3">{description}</p>}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 text-sm font-medium text-ink shrink-0 pb-1 border-b border-ink/25 hover:border-ink transition-colors"
        >
          {action.label}
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
