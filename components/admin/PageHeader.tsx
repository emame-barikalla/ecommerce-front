import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="t-h2">{title}</h1>
        {description && <p className="t-small mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
