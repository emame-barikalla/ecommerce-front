import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required (see SETUP.md). It must be set at build time.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server in .next/standalone, used by the Docker image.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    // Only this store's own public bucket: a wider pattern would let anyone
    // use our server to resize images from other Supabase projects.
    remotePatterns: [new URL('/storage/v1/object/public/**', supabaseUrl)],
    // Next 16 allows only 75 by default; the hero uses 85.
    qualities: [75, 85],
    // Keep optimized images 31 days to save Supabase egress.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
