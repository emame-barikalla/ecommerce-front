import { getLocale, getTranslations } from 'next-intl/server';
import { getStoreSettings } from '@/lib/utils/supabase-server';
import { getStoreStats } from '@/lib/store/trust';

/**
 * Figures entered by the store owner in the admin (customers served, orders
 * delivered). Renders nothing until at least one is set — the site never
 * shows an estimated or placeholder number.
 */
export default async function StoreStats({ className }: { className?: string }) {
  const [t, settings, locale] = await Promise.all([getTranslations('stats'), getStoreSettings(), getLocale()]);
  const stats = getStoreStats(settings);
  if (stats.length === 0) return null;

  // Western digits in Arabic too, consistent with prices across the site.
  const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale);

  return (
    <section aria-label={t('title')} className={className}>
      <dl className="flex flex-wrap justify-center gap-x-16 gap-y-8 text-center">
        {stats.map((stat) => (
          <div key={stat.key} className="flex flex-col-reverse items-center gap-1.5">
            <dt className="text-small text-ink-secondary">{t(stat.key, { count: stat.value })}</dt>
            <dd className="t-h1 tabular">
              <bdi>{number.format(stat.value)}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
