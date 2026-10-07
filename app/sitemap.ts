import type { MetadataRoute } from 'next';
import { LOCALES, SITE_URL } from '@/lib/config';
import { getSitemapEntries } from '@/lib/utils/supabase-server';

// Rebuilt at most hourly so new products are picked up without a deploy.
export const revalidate = 3600;

const STATIC_ROUTES = ['', '/catalog', '/categories', '/why-choose-us', '/about', '/contact'];

/** One entry per locale, each listing its siblings as hreflang alternates. */
function localized(path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]));
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getSitemapEntries();

  return [
    ...STATIC_ROUTES.flatMap((route) =>
      localized(route, { changeFrequency: route === '' ? 'daily' : 'weekly', priority: route === '' ? 1 : 0.7 })
    ),
    ...categories.flatMap((c) =>
      localized(`/catalog?category=${c.slug}`, { lastModified: c.updated_at, changeFrequency: 'weekly', priority: 0.7 })
    ),
    ...products.flatMap((p) =>
      localized(`/catalog/${p.slug}`, { lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.8 })
    ),
  ];
}
