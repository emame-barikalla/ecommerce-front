// Database type definitions

export type Locale = 'en' | 'fr' | 'ar';

export interface Store {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  /** Added by p1_catalog_fields.sql — absent until that migration runs. */
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryTranslation {
  id: string;
  category_id: string;
  locale: Locale;
  name: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export type Availability = 'in_stock' | 'low_stock' | 'on_order' | 'out_of_stock';

export const AVAILABILITIES: Availability[] = ['in_stock', 'low_stock', 'on_order', 'out_of_stock'];

export interface Product {
  id: string;
  store_id: string;
  category_id?: string | null;
  slug: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  // The three fields below come from p1_catalog_fields.sql. They are optional
  // so the storefront keeps working (and simply shows less) before it runs.
  compare_at_price?: number | null;
  availability?: Availability | null;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductTranslation {
  id: string;
  product_id: string;
  locale: Locale;
  name: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  message: string;
  locale: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  store_id: string;
  email: string;
  created_at: string;
}

// Combined types for frontend use. Translations are Partial: a product may
// exist in English only, and every reader must fall back explicitly.
export interface ProductWithDetails extends Product {
  category?: CategoryWithDetails;
  translations: Partial<Record<Locale, ProductTranslation>>;
  images: ProductImage[];
}

export interface CategoryWithDetails extends Category {
  translations: Partial<Record<Locale, CategoryTranslation>>;
}

