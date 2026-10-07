-- ============================================
-- SUPABASE STORAGE RLS POLICIES FIX
-- ============================================
-- Run this in Supabase SQL Editor to fix the upload error
-- URL: https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/sql/new

-- First, make sure the bucket exists via Dashboard:
-- Storage → New Bucket → Name: "product-images" → Public: YES

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================
DROP POLICY IF EXISTS "Allow all for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- Policy 1: Allow authenticated users to do everything
CREATE POLICY "Allow all for authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Policy 2: Allow public to read/view images
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ============================================
-- VERIFY POLICIES
-- ============================================
-- Run this to check if policies were created:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
