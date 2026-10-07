import { El_Messiri, Inter, Instrument_Serif, Tajawal } from 'next/font/google';

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

// Arabic is the default locale, so its faces are preloaded. Browsers still
// fetch a font only when its glyphs are used on the page.

/** Arabic body text — Tajawal is light, modern and stays legible at small sizes. */
export const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

/** Arabic headings — El Messiri's soft curves feel elegant without being traditional. */
export const elMessiri = El_Messiri({
  subsets: ['arabic'],
  weight: ['500', '600'],
  variable: '--font-arabic-display',
  display: 'swap',
});

export const fontVariables = [inter, instrumentSerif, tajawal, elMessiri]
  .map((f) => f.variable)
  .join(' ');
