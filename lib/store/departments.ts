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

/**
 * Editorial imagery per department: a matched pair (same sandstone street,
 * warm light, cream and camel styling) so the two tiles read as one brand.
 * `position` is the focal point kept in frame when a tile crops the portrait
 * photo to landscape on larger screens.
 */
export const DEPARTMENT_IMAGES: Record<Department, { src: string; position: string } | null> = {
  women: { src: '/assets/brand/women.jpg', position: '50% 15%' },
  men: { src: '/assets/brand/men.jpg', position: '50% 12%' },
};
