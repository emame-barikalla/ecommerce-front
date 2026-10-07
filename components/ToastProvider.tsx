'use client';

import { Toaster } from 'sonner';

/** Neutral toasts that follow the page direction (Sonner defaults to LTR). */
export default function ToastProvider({ dir }: { dir: 'ltr' | 'rtl' }) {
  return (
    <Toaster
      position="top-center"
      dir={dir}
      closeButton
      toastOptions={{
        classNames: {
          // Token colours, so toasts follow the light/dark theme.
          toast: '!font-[inherit] !rounded-lg !bg-surface !text-ink !border-line !shadow-lg !text-small',
          description: '!text-ink-secondary',
          actionButton: '!bg-ink !text-ink-inverse !rounded-sm !font-medium',
          closeButton: '!bg-surface !text-ink-secondary !border-line',
          success: '[&_[data-icon]]:!text-success',
          error: '[&_[data-icon]]:!text-error',
        },
      }}
    />
  );
}
