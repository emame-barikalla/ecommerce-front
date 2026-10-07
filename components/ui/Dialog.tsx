'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';
import { useModalBehavior } from './useModalBehavior';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  /** Pinned action row (buttons). */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

/**
 * Centered modal on desktop, bottom sheet on phones (thumb-reachable, never
 * taller than the screen). Unmounted when closed: dialogs hold form state that
 * should reset between openings.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  closeLabel,
  footer,
  size = 'md',
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useModalBehavior(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer flex items-end sm:items-center justify-center sm:p-6">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-scrim/45 animate-fade-in" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative flex flex-col w-full max-h-[92vh] bg-surface shadow-overlay',
          'rounded-t-xl sm:rounded-lg animate-rise',
          widths[size]
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
          <div className="min-w-0">
            <h2 id={titleId} className="t-h3">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="t-small mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid place-items-center w-11 h-11 -me-3 -mt-2 shrink-0 rounded-md text-ink-secondary hover:bg-surface-sunken hover:text-ink transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {children && <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>}

        {footer && (
          <footer className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 px-6 py-4 border-t border-line">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Destructive actions get the red button. */
  tone?: 'danger' | 'default';
  busy?: boolean;
}

/** Replacement for `window.confirm` — styled, translated, keyboard-safe. */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  busy,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      closeLabel={cancelLabel}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
