-- ============================================
-- E-COMMERCE DATABASE SCHEMA
-- Production-ready, future-ready for multi-store
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STORES (Future-ready for multi-store)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default store (single-store mode)
INSERT INTO stores (id, name, slug, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Store', 'default', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ============================================
-- CATEGORY TRANSLATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'fr', 'ar')),
  name TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, locale)
);

CREATE INDEX idx_category_translations_category ON category_translations(category_id);
CREATE INDEX idx_category_translations_locale ON category_translations(locale);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================
-- PRODUCT TRANSLATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'fr', 'ar')),
  name TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, locale)
);

CREATE INDEX idx_product_translations_product ON product_translations(product_id);
CREATE INDEX idx_product_translations_locale ON product_translations(locale);

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- ============================================
-- SETTINGS (Store configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, key)
);

CREATE INDEX idx_settings_store ON settings(store_id);

-- Default settings
INSERT INTO settings (store_id, key, value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'whatsapp_number', '+222XXXXXXXX'),
  ('00000000-0000-0000-0000-000000000001', 'store_name', 'España a Mauritania'),
  ('00000000-0000-0000-0000-000000000001', 'default_language', 'en')
ON CONFLICT (store_id, key) DO NOTHING;

-- ============================================
-- CART ITEMS (Optional - for DB persistence)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest carts
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORES POLICIES
-- ============================================
-- Public read access
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Public read access to active categories
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- CATEGORY TRANSLATIONS POLICIES
-- ============================================
-- Public read access
CREATE POLICY "Public can view category translations"
  ON category_translations FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage category translations"
  ON category_translations FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Public read access to active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- PRODUCT TRANSLATIONS POLICIES
-- ============================================
-- Public read access
CREATE POLICY "Public can view product translations"
  ON product_translations FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage product translations"
  ON product_translations FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- PRODUCT IMAGES POLICIES
-- ============================================
-- Public read access
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- SETTINGS POLICIES
-- ============================================
-- Public read access (for WhatsApp number, etc.)
CREATE POLICY "Public can view settings"
  ON settings FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- CART ITEMS POLICIES
-- ============================================
-- Users can manage their own cart items
CREATE POLICY "Users can manage their own cart items"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_translations_updated_at BEFORE UPDATE ON category_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON product_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- CONTACT & NEWSLETTER
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, email)
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);


-- View for products with translations and images
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.id,
  p.store_id,
  p.category_id,
  p.slug,
  p.price,
  p.is_active,
  p.sort_order,
  p.created_at,
  p.updated_at,
  c.slug as category_slug,
  (
    SELECT json_agg(
      json_build_object(
        'locale', pt.locale,
        'name', pt.name,
        'description', pt.description,
        'meta_title', pt.meta_title,
        'meta_description', pt.meta_description
      )
    )
    FROM product_translations pt
    WHERE pt.product_id = p.id
  ) as translations,
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'alt_text', pi.alt_text,
        'is_primary', pi.is_primary,
        'sort_order', pi.sort_order
      )
      ORDER BY pi.sort_order, pi.is_primary DESC
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) as images
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

