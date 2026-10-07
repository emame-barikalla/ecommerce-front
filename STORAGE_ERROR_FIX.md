# 🚨 URGENT: Fix Your Storage Upload Error

## What's Happening
Your code is trying to upload to Supabase Storage, but Supabase is blocking it with:
```
StorageApiError: new row violates row-level security policy
```

## Why This Happens
**Supabase Storage has Row-Level Security (RLS) enabled by default.** Without policies, NO ONE can upload files, even authenticated users.

## The 3-Step Fix (Takes 2 Minutes)

### ✅ STEP 1: Go to Your Supabase Dashboard

Open this exact URL in your browser:
```
https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/storage/buckets
```

### ✅ STEP 2: Create or Check the Bucket

**If the bucket doesn't exist:**
1. Click **"New bucket"**
2. Name: `product-images`
3. **Toggle "Public bucket" to ON** (green) ✅
4. Click **"Create"**

**If the bucket exists:**
1. Click on `product-images`
2. Go to **Configuration** tab
3. Make sure **"Public bucket"** is **ON** (green) ✅

### ✅ STEP 3: Add RLS Policies

1. Open this URL:
   ```
   https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/sql/new
   ```

2. Copy this ENTIRE SQL script:
   ```sql
   -- Drop any existing policies
   DROP POLICY IF EXISTS "Allow all for authenticated" ON storage.objects;
   DROP POLICY IF EXISTS "Public read access" ON storage.objects;

   -- Create policy for authenticated users to upload
   CREATE POLICY "Allow all for authenticated"
   ON storage.objects
   FOR ALL
   TO authenticated
   USING (bucket_id = 'product-images')
   WITH CHECK (bucket_id = 'product-images');

   -- Create policy for public to read
   CREATE POLICY "Public read access"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'product-images');
   ```

3. Paste it into the SQL Editor

4. Click the big green **"RUN"** button

5. You should see: ✅ **"Success. No rows returned"**

## Test It Now

1. Go to your admin panel: `http://localhost:3000/admin`
2. Make sure you're logged in
3. Click "Add Product" or "Edit Product"
4. Fill in the details
5. Select an image file
6. Click "Save"
7. **It should work!** ✅

## Still Not Working? Debug Checklist

Run through these checks:

### Check 1: Is the bucket public?
- Go to: https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/storage/buckets
- Click on `product-images`
- Configuration tab
- "Public bucket" should be **ON** (green)

### Check 2: Do the policies exist?
Run this in SQL Editor:
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname IN ('Allow all for authenticated', 'Public read access');
```
You should see 2 rows returned.

### Check 3: Are you logged in?
- Open browser DevTools (F12)
- Go to Console tab
- Type: `localStorage.getItem('supabase.auth.token')`
- Should return a long token string (not null)

### Check 4: Is the bucket name correct?
In your code, it's using `product-images` (line 242 of page.tsx).
Make sure the bucket in Supabase is named exactly `product-images` (with hyphen, not underscore).

## Alternative: Temporary Workaround

If you just want to test and don't care about security right now, you can disable RLS entirely:

```sql
-- WARNING: This makes the bucket completely open. Only for testing!
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Don't use this in production!** Re-enable it later:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## What the Policies Do

- **"Allow all for authenticated"**: Lets logged-in admins upload, update, and delete images
- **"Public read access"**: Lets anyone view the images (needed for your website visitors)

## Need More Help?

1. Check the visual guide in the artifacts panel
2. Copy the SQL from `fix_storage_policies.sql`
3. Make sure you're using the correct project URL

---

**Quick Links:**
- Storage Buckets: https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/storage/buckets
- SQL Editor: https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/sql/new
- Storage Policies: https://supabase.com/dashboard/project/uhmwdogkrehexiihbqga/storage/policies
