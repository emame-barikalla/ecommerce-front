'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useStoreSettings } from '@/lib/context/StoreSettingsContext';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';

/** Inline WhatsApp mark: self-contained, inherits `currentColor`. */
export function WhatsAppGlyph({ size = 21, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className ?? 'shrink-0'}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.38-.27.3-1.04 1.01-1.04 2.47s1.06 2.870 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.750-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.910 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21Z" />
    </svg>
  );
}

/**
 * Deliberately small and quiet: no pulse or glow, and it reveals its label
 * only on hover so it never competes with the page's own calls to action.
 * On mobile it floats above the bottom navigation.
 */
export default function WhatsAppButton() {
  const t = useTranslations('whatsapp');
  const { whatsappNumber } = useStoreSettings();
  const pathname = usePathname();

  // Product pages carry their own WhatsApp CTA plus a sticky mobile purchase
  // bar, and checkout has its own send button — a floating target there would
  // only collide with them. Without a configured number it would go nowhere.
  const hidden = /^\/[a-z]{2}\/(catalog\/.+|checkout)/.test(pathname);
  if (hidden || !whatsappNumber) return null;

  return (
    <a
      href={buildWhatsAppUrl(whatsappNumber, t('defaultMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('contactUs')}
      style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 1rem)' }}
      className="group fixed z-header end-4 lg:!bottom-7 lg:end-7
                 flex items-center gap-0 h-12 ps-3.5 pe-3.5 rounded-full
                 bg-whatsapp text-white shadow-lg
                 transition-[background-color,padding] duration-200
                 hover:bg-whatsapp-hover active:scale-95"
    >
      <WhatsAppGlyph />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-small font-medium transition-[max-width,margin] duration-300 ease-out group-hover:max-w-[9rem] group-hover:ms-2">
        {t('chatWithUs')}
      </span>
    </a>
  );
}
