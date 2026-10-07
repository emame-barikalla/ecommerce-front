import { extendTailwindMerge } from 'tailwind-merge';

type ClassValue = string | undefined | null | false;

// Our custom font-size tokens (tailwind.config.ts) would otherwise be read as
// text *colours* and wrongly override `text-ink` & co.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'caption', 'small', 'body'] }],
    },
  },
});

/**
 * Joins class names, letting later classes win over conflicting earlier ones
 * (`cn('relative', 'absolute')` → `absolute`), so component defaults can be
 * overridden through `className` regardless of CSS source order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}
