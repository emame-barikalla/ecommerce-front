'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal mechanics for Drawer and Dialog: scroll lock, Escape to close,
 * Tab trapped inside the panel, focus moved in on open and restored on close,
 * and `inert` while closed (React 18 has no `inert` prop, so it is set on the
 * DOM node) so a mounted-but-hidden panel never receives focus.
 */
export function useModalBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement>,
  initialFocusRef?: RefObject<HTMLElement>
) {
  // Read through a ref so a new `onClose` identity each render does not
  // re-run the effect (which would steal focus back to the close button).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const restoreTo = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // `inert` must be gone before focusing — this effect runs before the one
    // below that syncs it — and focus waits a frame for the panel to be shown.
    panelRef.current?.removeAttribute('inert');
    const frame = requestAnimationFrame(() =>
      (initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus()
    );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreTo?.focus?.();
    };
  }, [open, panelRef, initialFocusRef]);

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    if (open) node.removeAttribute('inert');
    else node.setAttribute('inert', '');
  }, [open, panelRef]);
}
