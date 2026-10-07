-- ============================================================
-- P0 SECURITY MIGRATION
-- Fixes: (1) any authenticated user had full admin rights,
--        (2) no admin role model, (3) open storage uploads.
-- Adds:  profiles + role, is_admin() helper, customer accounts base.
--
-- SAFE TO RE-RUN (idempotent). Paste the WHOLE file into the
-- Supabase SQL Editor and click RUN.
--
-- ⚠️ AFTER RUNNING: scroll to the bottom and set your admin email,
--    otherwise NOBODY can edit products/categories/settings.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES (one row per auth user, carries the role)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile whenever a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for users that already exist
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- keep updated_at fresh (reuses existing helper from schema.sql)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2. is_admin() — SECURITY DEFINER so it bypasses RLS on
--    profiles and never recurses inside a policy.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 3. PROFILES RLS
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Block privilege escalation: a non-admin cannot change their own role.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- ------------------------------------------------------------
-- 4. REWRITE WRITE POLICIES — admin-only instead of any
--    authenticated user. Public SELECT policies are left as-is.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage stores"                 ON stores;
DROP POLICY IF EXISTS "Admins can manage categories"             ON categories;
DROP POLICY IF EXISTS "Admins can manage category translations"  ON category_translations;
DROP POLICY IF EXISTS "Admins can manage products"               ON products;
DROP POLICY IF EXISTS "Admins can manage product translations"   ON product_translations;
DROP POLICY IF EXISTS "Admins can manage product images"         ON product_images;
DROP POLICY IF EXISTS "Admins can manage settings"               ON settings;

CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage category translations"
  ON category_translations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage products"
  ON products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage product translations"
  ON product_translations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 5. STORAGE — only admins can upload/modify product images.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for authenticated"     ON storage.objects;
DROP POLICY IF EXISTS "Public read access"              ON storage.objects;
DROP POLICY IF EXISTS "Admins manage product images"    ON storage.objects;
DROP POLICY IF EXISTS "Public read product images"      ON storage.objects;

CREATE POLICY "Admins manage product images"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- ------------------------------------------------------------
-- 6. CART ITEMS — owner-only (removes the fragile session hack)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own cart items" ON cart_items;
CREATE POLICY "Users manage own cart items"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. ⚠️ SET YOUR ADMIN ACCOUNT  ⚠️
--    Replace the email below with the account you log into
--    /admin/login with (it must already exist in
--    Authentication → Users), then this line promotes it.
-- ============================================================
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'REPLACE_WITH_YOUR_ADMIN_EMAIL';

-- Sanity check — should return your admin row:
-- SELECT email, role FROM public.profiles WHERE role = 'admin';
