import { notFound } from 'next/navigation';

/**
 * Catches unknown paths under a locale so they render the localized
 * `[locale]/not-found.tsx` inside the storefront layout — with multiple root
 * layouts there is no app-level 404 to fall back on.
 */
export default function CatchAll() {
  notFound();
}
