'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

const DISMISS_KEY = 'announcement_dismissed_v1';

/**
 * Short rotating messages, built on the server from store settings — the bar
 * only repeats promises the store has actually configured.
 */
export default function AnnouncementBar({ messages }: { messages: string[] }) {
  const t = useTranslations('announcement');
  // Rendered on the server so it never shifts the page after hydration. A
  // previous dismissal is applied pre-paint by the boot script in the layout.
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (dismissed || messages.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 6000);
    return () => clearInterval(id);
  }, [dismissed, messages.length]);

  if (dismissed || messages.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
      document.documentElement.dataset.announcement = 'hidden';
    } catch {
      // Private mode — dismissing for this render is enough.
    }
  };

  return (
    <div className="announcement-bar relative bg-surface-inverse text-white/90 h-[var(--announcement-h)] flex items-center overflow-hidden">
      <div className="container-page flex items-center justify-center">
        {/* No aria-live: a rotating marketing line should not interrupt a screen reader */}
        <p key={index} className="animate-fade-in text-caption tracking-[0.04em] text-center truncate px-10">
          {messages[index % messages.length]}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('dismiss')}
        className="absolute end-1 sm:end-4 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
