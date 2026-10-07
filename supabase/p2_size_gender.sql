-- ============================================================
-- P2 SIZE / GENDER MIGRATION
-- Purely additive: two nullable columns on products. Existing
-- RLS policies already cover them.
--
-- Run AFTER p1_catalog_fields.sql.
-- SAFE TO RE-RUN (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- size   : optional size / volume, free text so it fits every
--          product type — bags "M", shoes "42", beauty "50 ML".
--          Several values can be listed with commas: "41, 42, 43".
-- gender : main storefront department. NULL = not assigned yet,
--          the product is then listed under both Women and Men.
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_gender_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_gender_check
      CHECK (gender IS NULL OR gender IN ('women', 'men', 'unisex'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_size_length_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_size_length_check
      CHECK (size IS NULL OR char_length(size) <= 60);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(store_id, gender);

-- Sanity check:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name IN ('size', 'gender');
