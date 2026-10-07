import type { Gender, Product } from '@/lib/types/database';

/** The two main storefront departments, in navigation order. */
export type Department = Exclude<Gender, 'unisex'>;
export const DEPARTMENTS: Department[] = ['women', 'men'];

export function isDepartment(value: string | null | undefined): value is Department {
  return value === 'women' || value === 'men';
}

/**
 * Unisex products belong to both departments, and so do products not yet
 * assigned one — a department page never empties just because the catalog
 * has not been tagged.
 */
export function inDepartment(product: Pick<Product, 'gender'>, department: Department): boolean {
  return !product.gender || product.gender === 'unisex' || product.gender === department;
}

/** Editorial imagery per department. `null` renders a typographic panel. */
export const DEPARTMENT_IMAGES: Record<Department, string | null> = {
  women: '/assets/makeup.jpg',
  // Add a menswear photo to /public/assets and reference it here.
  men: null,
};
