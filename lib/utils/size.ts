/**
 * Product size / volume helpers. The field is free text so it fits every
 * product type: bags (`M`), shoes (`42`), beauty (`50 ML`). Several values
 * can be listed with commas (`41, 42, 43`).
 */
export function sizeValues(size: string | null | undefined): string[] {
  if (!size) return [];
  return size
    .split(/[,،/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A unit of capacity or weight means "volume"; anything else is a size. */
export function sizeKind(size: string): 'volume' | 'size' {
  return /\d\s*(ml|cl|l|g|kg|oz|مل|غ)\b/i.test(size) || /\b(ml|cl|oz)\b/i.test(size) ? 'volume' : 'size';
}
