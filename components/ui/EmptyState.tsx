import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Always give the user a way forward — an empty state without one is a dead end. */
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center px-6 py-20', className)}>
      <div className="grid place-items-center w-14 h-14 rounded-full bg-surface-sunken text-ink-tertiary mb-6">
        <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="t-h3 mb-2">{title}</h3>
      {description && <p className="t-small max-w-sm mb-7">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
