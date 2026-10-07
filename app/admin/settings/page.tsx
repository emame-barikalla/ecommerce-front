'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { AdminError, loadRawSettings, saveSettings } from '@/lib/admin/api';
import { SETTING_KEYS, type StoreSettings } from '@/lib/store/settings-schema';
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Values = Record<keyof StoreSettings, string>;
type Errors = Partial<Record<keyof StoreSettings, string>>;

const FIELDS = Object.keys(SETTING_KEYS) as Array<keyof StoreSettings>;
const NUMBER_FIELDS: Array<keyof StoreSettings> = [
  'deliveryDaysMin',
  'deliveryDaysMax',
  'freeDeliveryThreshold',
  'returnDays',
  'customersServed',
  'ordersDelivered',
];
const URL_FIELDS: Array<keyof StoreSettings> = ['instagramUrl', 'facebookUrl', 'tiktokUrl'];

function validate(v: Values): Errors {
  const e: Errors = {};
  const phoneDigits = v.whatsappNumber.replace(/\D/g, '');
  if (!v.whatsappNumber.trim()) e.whatsappNumber = 'Obligatoire : sans numéro, les clients ne peuvent pas commander.';
  else if (phoneDigits.length < 8 || phoneDigits.length > 15 || /x/i.test(v.whatsappNumber)) {
    e.whatsappNumber = 'Numéro international attendu, ex. : +222 22 12 34 56.';
  }
  if (!v.storeName.trim()) e.storeName = 'Obligatoire.';
  if (v.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contactEmail.trim())) {
    e.contactEmail = 'Adresse e-mail invalide.';
  }
  for (const field of NUMBER_FIELDS) {
    const raw = v[field].trim();
    if (raw && (!Number.isFinite(Number(raw)) || Number(raw) <= 0)) e[field] = 'Nombre positif attendu, ou laissez vide.';
  }
  for (const field of URL_FIELDS) {
    if (v[field].trim() && !/^https?:\/\/\S+$/i.test(v[field].trim())) e[field] = 'Adresse complète attendue (https://…).';
  }
  const min = v.deliveryDaysMin.trim();
  const max = v.deliveryDaysMax.trim();
  if ((min && !max) || (!min && max)) e.deliveryDaysMax = 'Renseignez les deux valeurs, ou aucune.';
  else if (min && max && Number(min) > Number(max)) e.deliveryDaysMax = 'Le maximum doit être supérieur ou égal au minimum.';
  return e;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 md:p-6">
      <h2 className="text-body font-medium text-ink">{title}</h2>
      {description && <p className="t-small mt-1">{description}</p>}
      <div className="mt-5 grid sm:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Values | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoadError(null);
    try {
      const raw = await loadRawSettings();
      const next = Object.fromEntries(FIELDS.map((f) => [f, raw[SETTING_KEYS[f]] ?? ''])) as Values;
      // The schema seeds a placeholder number; show an empty field instead.
      if (/x/i.test(next.whatsappNumber)) next.whatsappNumber = '';
      setValues(next);
    } catch (e) {
      setLoadError(e instanceof AdminError ? e.message : 'Impossible de charger les réglages.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loadError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Chargement impossible"
        description={loadError}
        action={<Button onClick={load}>Réessayer</Button>}
        className="rounded-lg border border-line bg-white"
      />
    );
  }

  if (!values) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const set = (field: keyof StoreSettings) => (e: { target: { value: string } }) => {
    setValues((v) => (v ? { ...v, [field]: e.target.value } : v));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Corrigez les champs signalés.');
      return;
    }
    setSaving(true);
    try {
      await saveSettings(values);
      toast.success('Réglages enregistrés. La boutique est à jour.');
    } catch (err) {
      toast.error(err instanceof AdminError ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const text = (field: keyof StoreSettings, label: string, props: Record<string, unknown> = {}, hint?: string) => (
    <Field label={label} hint={hint} error={errors[field]}>
      <Input value={values[field]} onChange={set(field)} {...props} />
    </Field>
  );
  const number = (field: keyof StoreSettings, label: string, hint?: string) =>
    text(field, label, { type: 'number', inputMode: 'numeric', min: '1', step: '1' }, hint);

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="Réglages" description="Informations et engagements affichés sur la boutique." />

      <div className="space-y-6">
        <Section title="Boutique">
          <Field label="Nom de la boutique" error={errors.storeName} required>
            <Input value={values.storeName} onChange={set('storeName')} />
          </Field>
          {text('contactEmail', 'E-mail de contact', { type: 'email', dir: 'ltr' }, 'Affiché dans le pied de page et la page contact.')}
        </Section>

        <Section title="WhatsApp" description="Toutes les commandes sont envoyées à ce numéro.">
          <Field
            label="Numéro WhatsApp"
            hint="Format international avec l’indicatif pays, ex. : +222 22 12 34 56."
            error={errors.whatsappNumber}
            required
          >
            <Input type="tel" dir="ltr" value={values.whatsappNumber} onChange={set('whatsappNumber')} />
          </Field>
          {values.whatsappNumber.replace(/\D/g, '').length >= 8 && !errors.whatsappNumber && (
            <div className="flex items-end">
              <a
                href={buildWhatsAppUrl(values.whatsappNumber, 'Test depuis l’administration')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 text-small text-ink underline underline-offset-4"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Tester le lien WhatsApp
              </a>
            </div>
          )}
        </Section>

        <Section
          title="Livraison et engagements"
          description="Chaque engagement n’apparaît sur la boutique (bandeau, fiche produit, FAQ, commande) que s’il est renseigné. Laissez vide ce que vous ne proposez pas réellement."
        >
          {number('deliveryDaysMin', 'Délai de livraison minimum (jours)')}
          {number('deliveryDaysMax', 'Délai de livraison maximum (jours)')}
          {number('freeDeliveryThreshold', 'Livraison gratuite à partir de (MRU)', 'Vide = pas de livraison gratuite affichée.')}
          {number('returnDays', 'Retours acceptés sous (jours)', 'Vide = aucune politique de retour affichée.')}
          <div className="sm:col-span-2">
            <Checkbox
              label="Je garantis l’authenticité de tous les produits"
              hint="Affiche la mention « Produits authentiques ». Ne cochez que si c’est un engagement réel."
              checked={values.authenticityGuarantee === 'true'}
              onChange={(e) => setValues((v) => (v ? { ...v, authenticityGuarantee: e.target.checked ? 'true' : '' } : v))}
            />
          </div>
        </Section>

        <Section
          title="Chiffres de la boutique"
          description="Affichés sur l’accueil et la page « Pourquoi nous ». Indiquez uniquement des chiffres réels et vérifiables ; vide = section masquée."
        >
          {number('customersServed', 'Nombre de clients servis')}
          {number('ordersDelivered', 'Nombre de commandes livrées')}
        </Section>

        <Section title="Réseaux sociaux" description="Seuls les réseaux renseignés apparaissent dans le pied de page.">
          {text('instagramUrl', 'Instagram', { type: 'url', dir: 'ltr', placeholder: 'https://instagram.com/…' })}
          {text('facebookUrl', 'Facebook', { type: 'url', dir: 'ltr', placeholder: 'https://facebook.com/…' })}
          {text('tiktokUrl', 'TikTok', { type: 'url', dir: 'ltr', placeholder: 'https://tiktok.com/@…' })}
        </Section>
      </div>

      <div
        className="sticky bottom-0 z-header -mx-4 sm:-mx-6 lg:mx-0 mt-8 px-4 sm:px-6 lg:px-0 py-4 bg-surface-subtle/95 backdrop-blur-md border-t border-line lg:border-0 flex justify-end"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les réglages'}
        </Button>
      </div>
    </form>
  );
}
