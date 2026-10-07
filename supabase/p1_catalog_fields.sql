-- ============================================================
-- P1 CATALOG FIELDS MIGRATION
-- Purely additive: new nullable/defaulted columns + two admin
-- read policies. No table or column is dropped, existing RLS
-- policies are untouched (the admin FOR ALL policies from
-- p0_security.sql already cover the new columns).
--
-- Run AFTER schema.sql and p0_security.sql.
-- SAFE TO RE-RUN (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRODUCTS
--    compare_at_price : original price when the item is marked
--                       down (shown struck through + % badge)
--    availability     : a status, not a quantity — stock lives
--                       in Spain, so a unit count would be fiction.
--                       NULL = not specified: nothing is shown, so
--                       no product claims to be in stock by default
--    is_featured      : merchandised on the homepage
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_availability_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_availability_check
      CHECK (availability IS NULL OR availability IN ('in_stock', 'low_stock', 'on_order', 'out_of_stock'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_compare_at_price_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_compare_at_price_check
      CHECK (compare_at_price IS NULL OR compare_at_price > price);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products(store_id, is_featured) WHERE is_featured = true;

-- ------------------------------------------------------------
-- 2. CATEGORIES — editorial image (replaces the hardcoded
--    slug → image map in the storefront)
-- ------------------------------------------------------------
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ------------------------------------------------------------
-- 3. ADMIN READ ACCESS to contact messages and newsletter
--    subscribers. Before this, rows were insert-only and
--    nobody — admin included — could read them.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can read contact messages"     ON contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages"   ON contact_messages;
DROP POLICY IF EXISTS "Admins can read newsletter"           ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete newsletter"         ON newsletter_subscribers;

CREATE POLICY "Admins can read contact messages"
  ON contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete contact messages"
  ON contact_messages FOR DELETE USING (public.is_admin());
CREATE POLICY "Admins can read newsletter"
  ON newsletter_subscribers FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete newsletter"
  ON newsletter_subscribers FOR DELETE USING (public.is_admin());

-- Sanity check:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name IN ('compare_at_price','availability','is_featured');
