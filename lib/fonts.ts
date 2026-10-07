import { IBM_Plex_Sans_Arabic, Inter, Instrument_Serif, Noto_Kufi_Arabic } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

/** Latin-only editorial display face, used for large headings only. */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

// Arabic faces are not preloaded: browsers fetch a font only when its glyphs
// are used, so English and French pages no longer download them at all.

/** Arabic body text — Plex pairs with Inter and stays legible at 15px. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});

/** Arabic headings — Kufi's geometry echoes the Latin display face. */
export const kufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic-display',
  display: 'swap',
  preload: false,
});

export const fontVariables = [inter, instrumentSerif, plexArabic, kufiArabic]
  .map((f) => f.variable)
  .join(' ');
