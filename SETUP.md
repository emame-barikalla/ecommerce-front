# 🚀 E-Commerce CMS Setup Guide

This guide will help you set up the complete e-commerce system with Supabase backend.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git (optional)

## 🔧 Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 1.3 Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase/schema.sql` from this project
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify tables are created in **Table Editor**

### 1.4 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `product-images`
4. Make it **Public** (uncheck "Private bucket")
5. Click **Create bucket**

### 1.5 Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. (Optional) Configure email templates

### 1.6 Create Admin User

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: Your admin email
   - **Password**: Strong password
   - **Auto Confirm User**: ✅ (check this)
4. Click **Create user**
5. Save these credentials!

## 🔑 Step 2: Environment Variables

1. Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Replace with your actual Supabase values from Step 1.2

## 📦 Step 3: Install Dependencies

```bash
npm install
```

## 🎨 Step 4: Update RLS Policies (Important!)

The schema includes RLS policies, but you may need to adjust them:

1. Go to **Authentication** → **Policies** in Supabase
2. Verify policies are created (they should be from the schema)
3. For admin access, ensure authenticated users can manage products/categories

**Note**: The current RLS policies allow:
- **Public**: Read-only access to active products/categories
- **Authenticated**: Full access (admin)

## 🚀 Step 5: Run Development Server

```bash
npm run dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/login

## ✅ Step 6: First Login

1. Go to `/admin/login`
2. Use the admin credentials you created in Step 1.6
3. You should see the admin dashboard

## 📝 Step 7: Initial Setup in Admin

1. **Add Categories**:
   - Go to **Categories** tab
   - Click **Add Category**
   - Fill in name (EN, FR, AR) and slug
   - Save

2. **Add Products**:
   - Go to **Products** tab
   - Click **Add Product**
   - Fill in all fields
   - Upload images (will be stored in Supabase Storage)
   - Save

3. **Configure Settings**:
   - Go to **Settings** tab
   - Update WhatsApp number
   - Save

## 🔒 Security Notes

1. **Never commit** `.env.local` to Git
2. The `anon` key is safe for client-side use (RLS protects data)
3. For production, consider:
   - Setting up custom domain
   - Enabling rate limiting
   - Setting up backup strategy

## 🐛 Troubleshooting

### "Failed to fetch products"
- Check Supabase URL and key in `.env.local`
- Verify RLS policies are enabled
- Check browser console for errors

### "Upload failed"
- Verify `product-images` bucket exists and is public
- Check file size (Supabase free tier: 50MB limit)

### "Login failed"
- Verify user exists in Supabase Auth
- Check email/password are correct
- Ensure user is confirmed

### Images not showing
- Check Supabase Storage bucket is public
- Verify image URLs in database
- Check Next.js image configuration

## 📚 Next Steps

1. **Customize Design**: Update Tailwind classes in components
2. **Add More Features**: Orders, payments, etc.
3. **Deploy**: 
   - Frontend: Vercel/Netlify
   - Database: Already on Supabase
4. **SEO**: Update meta tags, add sitemap
5. **Analytics**: Add Google Analytics or similar

## 🆘 Support

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project Issues**: Check GitHub issues (if applicable)

---

**🎉 You're all set!** Start adding products and categories in the admin panel.


## Mise à jour 2026 — migration et réglages

1. Dans l’éditeur SQL de Supabase, exécutez `supabase/p1_catalog_fields.sql`
   (après `schema.sql` et `p0_security.sql`). Il ajoute uniquement :
   `products.compare_at_price`, `products.availability` (NULL = non précisée),
   `products.is_featured`, `categories.image_url`, et la lecture admin des
   messages de contact / inscriptions newsletter.
2. Dans `/admin/settings`, renseignez au minimum le **numéro WhatsApp** :
   sans lui, la commande est désactivée sur la boutique.
3. Les engagements (livraison gratuite, délais, retours, authenticité) et les
   chiffres (clients servis, commandes livrées) ne s’affichent que s’ils sont
   renseignés dans les réglages.
4. Variable d’environnement facultative : `NEXT_PUBLIC_SITE_URL`
   (domaine utilisé pour le sitemap, les métadonnées et les liens WhatsApp).
   Les pages publiques sont statiques et se rafraîchissent toutes les 60 s ;
   chaque modification faite dans l’admin les rafraîchit immédiatement
   (route `/api/revalidate`, réservée aux administrateurs).
