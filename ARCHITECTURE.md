# 🏗️ System Architecture

## Overview

This is a production-ready, single-store e-commerce CMS built with Next.js 14 (App Router) and Supabase. The system is designed to be **future-ready for multi-store expansion** without requiring refactoring.

## 🎯 Core Features

### ✅ Implemented

1. **Admin CMS** (`/admin`)
   - Supabase Authentication
   - Product Management (CRUD)
   - Category Management (CRUD)
   - Image Upload (Supabase Storage)
   - Settings Management (WhatsApp number)
   - Multi-language support (EN, FR, AR)

2. **Public Frontend**
   - Product Catalog with filtering
   - Shopping Cart (localStorage)
   - WhatsApp Checkout
   - Multi-language support
   - Responsive design

3. **Database**
   - PostgreSQL (via Supabase)
   - Row Level Security (RLS)
   - Optimized indexes
   - Future-ready schema (stores table for multi-store)

4. **Security**
   - RLS policies for data access
   - Admin-only access to CMS
   - Public read-only access to products

## 📁 Project Structure

```
frontend-ecommerce/
├── app/
│   ├── [locale]/              # Localized routes
│   │   ├── catalog/          # Product catalog page
│   │   └── layout.tsx        # Locale layout with Navbar
│   ├── admin/                # Admin CMS
│   │   ├── login/            # Admin login page
│   │   ├── layout.tsx        # Protected admin layout
│   │   └── page.tsx         # Admin dashboard
│   └── layout.tsx            # Root layout
├── components/
│   ├── Navbar.tsx            # Main navigation
│   ├── ProductCard.tsx       # Product display card
│   ├── Cart.tsx              # Shopping cart sidebar
│   ├── CartButton.tsx        # Cart icon with badge
│   └── WhatsAppButton.tsx   # Floating WhatsApp button
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   └── server.ts         # Server Supabase client
│   ├── hooks/
│   │   └── useCart.ts        # Cart state management
│   ├── utils/
│   │   └── supabase.ts       # Data fetching utilities
│   └── types/
│       └── database.ts       # TypeScript types
├── messages/                 # i18n translations
│   ├── en.json
│   ├── fr.json
│   └── ar.json
├── supabase/
│   └── schema.sql           # Database schema + RLS
└── SETUP.md                  # Setup instructions
```

## 🗄️ Database Schema

### Core Tables

1. **stores** - Future-ready for multi-store
2. **categories** - Product categories
3. **category_translations** - Category i18n
4. **products** - Product data
5. **product_translations** - Product i18n
6. **product_images** - Product images (references Supabase Storage)
7. **settings** - Store configuration
8. **cart_items** - Optional DB cart persistence

### Key Design Decisions

- **Normalized translations**: Separate tables for translations (better for queries)
- **Store ID**: All tables include `store_id` for future multi-store
- **Slugs**: URL-friendly identifiers for SEO
- **Soft deletes**: `is_active` flags instead of hard deletes
- **Image storage**: Supabase Storage with public URLs

## 🔐 Security (RLS Policies)

### Public Access (Read-Only)
- Active products
- Active categories
- Translations
- Product images
- Settings (for WhatsApp number)

### Admin Access (Full CRUD)
- All products (active/inactive)
- All categories
- All translations
- Image uploads
- Settings management

## 🛒 Shopping Cart

### Implementation
- **Storage**: localStorage (client-side)
- **State**: React hook (`useCart`)
- **Features**:
  - Add/remove items
  - Update quantities
  - Calculate totals
  - Generate WhatsApp message
  - Persist across sessions

### Future Enhancement
- Optional DB persistence for logged-in users
- Cart sync across devices

## 🌐 Multi-Language Support

### Implementation
- **Framework**: next-intl
- **Languages**: English, French, Arabic
- **Storage**: Database (translation tables)
- **Fallback**: English if translation missing

### How It Works
1. User selects language in navbar
2. URL updates: `/en/catalog` → `/fr/catalog`
3. Components fetch translations from DB
4. Fallback to English if translation missing

## 📱 WhatsApp Integration

### Features
- Configurable WhatsApp number (admin settings)
- Product-level contact
- Cart checkout with order summary
- Pre-filled messages

### Implementation
- Number stored in `settings` table
- WhatsApp Web API (free, no paid API needed)
- Message formatting for orders

## 🚀 Performance Optimizations

### Frontend
- Next.js Image optimization
- Static generation where possible
- Client-side caching (localStorage)
- Lazy loading components

### Backend
- Database indexes on foreign keys
- Efficient queries (joins, selects)
- Supabase CDN for images
- RLS at database level (no app-level checks needed)

## 🔄 Future-Ready Design

### Multi-Store Support
The schema is designed for easy multi-store expansion:

1. **Current**: Single store (default store ID)
2. **Future**: Add `store_id` filter to all queries
3. **No refactor needed**: Just add store selection UI

### Extensibility Points

1. **Orders**: Add `orders` and `order_items` tables
2. **Payments**: Add payment gateway integration
3. **Users**: Extend `auth.users` with profiles
4. **Reviews**: Add `product_reviews` table
5. **Inventory**: Add `product_stock` table

## 📊 API Structure

### Current (Direct Supabase)
- Client-side: Direct Supabase queries with RLS
- Server-side: Server components use server client
- No custom API routes needed (RLS handles security)

### Future (If Needed)
- API routes for complex operations
- Webhooks for order processing
- Server actions for mutations

## 🧪 Testing Strategy

### Recommended
1. **Unit Tests**: Cart logic, utilities
2. **Integration Tests**: Admin CRUD operations
3. **E2E Tests**: Complete user flows
4. **RLS Tests**: Verify security policies

## 📈 Scalability

### Current Capacity
- **Supabase Free Tier**: 
  - 500MB database
  - 1GB storage
  - 50MB file uploads
  - 2GB bandwidth

### Scaling Path
1. **Database**: Upgrade Supabase plan
2. **Storage**: Use CDN for images
3. **Caching**: Add Redis for frequently accessed data
4. **CDN**: Vercel Edge Network (automatic)

## 🔧 Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Database Changes**:
   - Update `supabase/schema.sql`
   - Run in Supabase SQL Editor
   - Or use Supabase CLI for migrations

3. **Deployment**:
   - Frontend: Vercel/Netlify
   - Database: Already on Supabase
   - Environment: Set env vars in hosting platform

## 📝 Best Practices Followed

✅ **Security**
- RLS policies for all tables
- Environment variables for secrets
- No sensitive data in client code

✅ **Performance**
- Database indexes
- Optimized queries
- Image optimization

✅ **Code Quality**
- TypeScript for type safety
- Component-based architecture
- Reusable utilities

✅ **User Experience**
- Responsive design
- Loading states
- Error handling
- Multi-language support

✅ **Maintainability**
- Clear file structure
- Documented code
- Future-ready schema

---

**Built with ❤️ for production use**

