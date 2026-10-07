'use client';

import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useModalBehavior } from './useModalBehavior';

type Side = 'end' | 'start' | 'bottom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Accessible label of the close button, in the page language. */
  closeLabel: string;
  /** Rendered next to the close button in the header. */
  headerAction?: ReactNode;
  /** Pinned below the scroll area — use for totals and the primary CTA. */
  footer?: ReactNode;
  side?: Side;
  className?: string;
  children: ReactNode;
}

const panelBySide: Record<Side, string> = {
  end: 'top-0 end-0 h-full w-full sm:w-[26rem] border-s',
  start: 'top-0 start-0 h-full w-full sm:w-[22rem] border-e',
  bottom: 'bottom-0 inset-x-0 max-h-[85vh] rounded-t-xl border-t',
};

/**
 * Side or bottom sheet. Slides with a direction-correct transform
 * (`translate-x-full` alone travels the wrong way under RTL).
 */
export default function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  headerAction,
  footer,
  side = 'end',
  className,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalBehavior(open, onClose, panelRef, closeRef);

  const hiddenTransform =
    side === 'bottom' ? 'translate-y-full' : side === 'end' ? 'drawer-hidden-end' : 'drawer-hidden-start';

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-overlay bg-scrim/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={cn(
          'fixed z-drawer flex flex-col bg-surface border-line shadow-overlay',
          'duration-300 ease-out',
          panelBySide[side],
          // Opening shows the panel at once (so it can take focus); closing
          // hides it only after the slide-out, so a closed panel and its
          // shadow can never peek in at the screen edge.
          open
            ? 'drawer-shown translate-y-0 visible transition-transform'
            : cn(hiddenTransform, 'invisible pointer-events-none transition-[transform,visibility]'),
          className
        )}
        style={side === 'bottom' ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
      >
        <header className="flex items-center justify-between gap-3 px-5 h-16 border-b border-line shrink-0">
          <h2 className="t-h3">{title}</h2>
          <div className="flex items-center gap-1">
            {headerAction}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="grid place-items-center w-11 h-11 -me-2.5 rounded-md text-ink-secondary hover:bg-surface-sunken hover:text-ink transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <div className="shrink-0 border-t border-line bg-surface">{footer}</div>}
      </div>
    </>
  );
}
