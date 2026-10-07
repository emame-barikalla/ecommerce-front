import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Inbox, Mail, Package, Plus, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LOCALES, STORE_ID } from '@/lib/config';
import { parseSettings } from '@/lib/store/settings-schema';
import { LOCALE_LABELS } from '@/lib/admin/labels';
import PageHeader from '@/components/admin/PageHeader';
import { buttonStyles } from '@/components/ui/Button';

// Always fresh: this is the owner's to-do list.
export const dynamic = 'force-dynamic';

type ProductRow = {
  id: string;
  is_active: boolean;
  images: { id: string }[];
  translations: { locale: string }[];
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [products, categories, messages, subscribers, settingsRows, migration] = await Promise.all([
    supabase
      .from('products')
      .select('id, is_active, images:product_images(id), translations:product_translations(locale)')
      .eq('store_id', STORE_ID),
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', STORE_ID).eq('is_active', true),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('store_id', STORE_ID),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('store_id', STORE_ID),
    supabase.from('settings').select('key, value').eq('store_id', STORE_ID),
    // Probes a column added by p1_catalog_fields.sql.
    supabase.from('products').select('availability').limit(1),
  ]);

  const rows = (products.data ?? []) as ProductRow[];
  const active = rows.filter((p) => p.is_active);
  const settings = parseSettings(settingsRows.data ?? []);
  const withoutImages = active.filter((p) => p.images.length === 0).length;
  const missingTranslations = LOCALES.map((locale) => ({
    locale,
    count: active.filter((p) => !p.translations.some((t) => t.locale === locale)).length,
  })).filter((m) => m.count > 0);
  // Missing read policy (migration not run) shows as an error, not as zero.
  const messagesCount = messages.error ? null : messages.count ?? 0;
  const subscribersCount = subscribers.error ? null : subscribers.count ?? 0;

  const tasks = [
    migration.error && {
      tone: 'error' as const,
      text: 'La base de données n’est pas à jour. Exécutez supabase/p1_catalog_fields.sql dans l’éditeur SQL de Supabase pour activer le prix barré, la disponibilité, les produits vedettes et les messages.',
    },
    !settings.whatsappNumber && {
      tone: 'error' as const,
      text: 'Aucun numéro WhatsApp valide : les clients ne peuvent pas envoyer de commande.',
      href: '/admin/settings',
    },
    withoutImages > 0 && {
      tone: 'warning' as const,
      text: `${withoutImages} produit(s) actif(s) sans image.`,
      href: '/admin/products',
    },
    ...missingTranslations.map((m) => ({
      tone: 'warning' as const,
      text: `${m.count} produit(s) actif(s) sans nom en ${LOCALE_LABELS[m.locale].toLowerCase()} — la boutique affichera une autre langue.`,
      href: '/admin/products',
    })),
  ].filter(Boolean) as Array<{ tone: 'error' | 'warning'; text: string; href?: string }>;

  const stats = [
    { label: 'Produits en ligne', value: active.length, sub: `${rows.length - active.length} archivé(s)`, icon: Package, href: '/admin/products' },
    { label: 'Catégories actives', value: categories.count ?? 0, icon: Tag, href: '/admin/categories' },
    { label: 'Messages reçus', value: messagesCount, icon: Inbox, href: '/admin/messages' },
    { label: 'Inscrits newsletter', value: subscribersCount, icon: Mail, href: '/admin/messages' },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`Vue d’ensemble de ${settings.storeName}.`}
        actions={
          <Link href="/admin/products/new" className={buttonStyles()}>
            <Plus size={16} aria-hidden="true" />
            Nouveau produit
          </Link>
        }
      />

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="block h-full rounded-lg border border-line bg-white p-4 md:p-5 hover:border-line-strong transition-colors"
            >
              <stat.icon size={18} strokeWidth={1.6} aria-hidden="true" className="text-ink-tertiary" />
              <p className="mt-3 text-2xl font-medium tabular text-ink">{stat.value ?? '—'}</p>
              <p className="text-small text-ink-secondary">{stat.label}</p>
              {stat.sub && <p className="text-caption text-ink-tertiary mt-0.5">{stat.sub}</p>}
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="tasks-heading" className="mt-10">
        <h2 id="tasks-heading" className="t-h3 mb-4">
          À faire
        </h2>
        {tasks.length === 0 ? (
          <p className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-4 text-small text-ink-secondary">
            <CheckCircle2 size={17} aria-hidden="true" className="text-success" />
            Tout est en ordre.
          </p>
        ) : (
          <ul className="rounded-lg border border-line bg-white divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.text} className="flex items-start gap-3 p-4">
                <AlertTriangle
                  size={17}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${task.tone === 'error' ? 'text-error' : 'text-accent'}`}
                />
                <p className="flex-1 text-small text-ink">{task.text}</p>
                {task.href && (
                  <Link href={task.href} className="inline-flex items-center gap-1 text-small font-medium text-ink shrink-0 hover:underline underline-offset-4">
                    Corriger
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
