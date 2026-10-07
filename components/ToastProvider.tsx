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
          toast: 'font-sans !rounded-md !border-line !shadow-lg !text-small',
          success: '[&_[data-icon]]:!text-success',
          error: '[&_[data-icon]]:!text-error',
        },
      }}
    />
  );
}
