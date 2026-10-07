# 🛒 E-Commerce CMS - España a Mauritania

A production-ready, single-store e-commerce web application with a simple admin CMS for non-technical users.

## ✨ Features

- 🛍️ **Product Catalog** - Browse products with category filtering
- 🛒 **Shopping Cart** - Add products, manage quantities, checkout via WhatsApp
- 🌐 **Multi-Language** - English, French, Arabic support
- 📱 **WhatsApp Integration** - Direct contact and order placement
- 🔐 **Admin CMS** - Secure admin panel for product/category management
- 🖼️ **Image Management** - Upload and manage product images
- ⚡ **Fast & SEO-Friendly** - Next.js 14 with App Router
- 🔒 **Secure** - Row Level Security (RLS) with Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### Installation

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a Supabase project
   - Run `supabase/schema.sql` in SQL Editor
   - Create `product-images` storage bucket (public)
   - Get your API keys

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Access the app**:
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   └── admin/             # Admin CMS
├── components/            # React components
├── lib/                  # Utilities & hooks
├── messages/             # i18n translations
├── supabase/             # Database schema
└── public/               # Static assets
```

## 🎯 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **i18n**: next-intl
- **Icons**: lucide-react

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture & design decisions

## 🔐 Admin Access

1. Create an admin user in Supabase Authentication
2. Login at `/admin/login`
3. Manage products, categories, and settings

## 🛒 Shopping Cart

- Add products to cart
- Update quantities
- View total price
- Checkout via WhatsApp with order summary

## 🌍 Multi-Language

The app supports:
- 🇬🇧 English
- 🇫🇷 French  
- 🇸🇦 Arabic

Translations are stored in the database and can be managed via the admin panel.

## 🔒 Security

- Row Level Security (RLS) on all tables
- Admin-only access to CMS
- Public read-only access to products
- Secure image uploads via Supabase Storage

## 🚀 Deployment

### Frontend (Vercel Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database

Already on Supabase - no additional setup needed!

## 📈 Future Enhancements

- Multi-store support (schema ready)
- Order management
- Payment gateway integration
- User accounts & order history
- Product reviews
- Inventory management

## 🤝 Contributing

This is a production-ready template. Feel free to:
- Customize the design
- Add features
- Extend functionality

## 📄 License

MIT License - feel free to use for your projects!

## 🆘 Support

- Check [SETUP.md](./SETUP.md) for troubleshooting
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system details
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Built with ❤️ for production use**
