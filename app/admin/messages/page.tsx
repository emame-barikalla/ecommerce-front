import { AlertCircle, Inbox, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { STORE_ID } from '@/lib/config';
import { formatDate } from '@/lib/admin/labels';
import type { ContactMessage, NewsletterSubscriber } from '@/lib/types/database';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import DeleteMessageButton from './DeleteMessageButton';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const [messages, subscribers] = await Promise.all([
    supabase
      .from('contact_messages')
      .select('*')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (messages.error || subscribers.error) {
    console.error('[admin/messages]', messages.error ?? subscribers.error);
    return (
      <>
        <PageHeader title="Messages" />
        <EmptyState
          icon={AlertCircle}
          title="Messages inaccessibles"
          description="Exécutez supabase/p1_catalog_fields.sql dans Supabase : il ajoute l’autorisation de lecture des messages pour l’administrateur."
          className="rounded-lg border border-line bg-white"
        />
      </>
    );
  }

  const contact = (messages.data ?? []) as ContactMessage[];
  const newsletter = (subscribers.data ?? []) as NewsletterSubscriber[];

  return (
    <>
      <PageHeader title="Messages" description="Messages du formulaire de contact et inscriptions à la newsletter." />

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="t-h3 mb-4">
          Formulaire de contact <span className="text-ink-tertiary font-normal">({contact.length})</span>
        </h2>
        {contact.length === 0 ? (
          <EmptyState icon={Inbox} title="Aucun message" className="rounded-lg border border-line bg-white py-12" />
        ) : (
          <ul className="space-y-3">
            {contact.map((m) => (
              <li key={m.id} className="rounded-lg border border-line bg-white p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{m.name}</p>
                    <p className="text-caption text-ink-tertiary">
                      {formatDate(m.created_at)} · {m.locale.toUpperCase()}
                      {m.email && (
                        <>
                          {' · '}
                          <a href={`mailto:${m.email}`} className="text-ink-secondary underline underline-offset-2">
                            {m.email}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <DeleteMessageButton id={m.id} />
                </div>
                <p className="mt-3 t-small text-ink whitespace-pre-line break-words">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="newsletter-heading" className="mt-12">
        <h2 id="newsletter-heading" className="t-h3 mb-4">
          Newsletter <span className="text-ink-tertiary font-normal">({newsletter.length})</span>
        </h2>
        {newsletter.length === 0 ? (
          <EmptyState icon={Mail} title="Aucun inscrit" className="rounded-lg border border-line bg-white py-12" />
        ) : (
          <div className="rounded-lg border border-line bg-white overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line text-start">
                  <th scope="col" className="px-4 py-3 text-start font-medium text-ink-secondary">
                    E-mail
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium text-ink-secondary">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {newsletter.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-ink">{s.email}</td>
                    <td className="px-4 py-3 text-ink-tertiary whitespace-nowrap">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
