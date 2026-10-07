'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { AlertCircle, Archive, ImageOff, ImagePlus, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react';
import {
  AdminError,
  SLUG_PATTERN,
  listCategories,
  saveCategory,
  setCategoryActive,
  slugify,
  uploadCategoryImage,
  validateImage,
  type CategoryInput,
} from '@/lib/admin/api';
import { LOCALES } from '@/lib/config';
import { categoryName } from '@/lib/i18n/localize';
import type { CategoryWithDetails, Locale } from '@/lib/types/database';
import PageHeader from '@/components/admin/PageHeader';
import LocaleTabs from '@/components/admin/LocaleTabs';
import Dialog, { ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Translations = CategoryInput['translations'];

const emptyTranslations = (): Translations => ({
  en: { name: '', description: '' },
  fr: { name: '', description: '' },
  ar: { name: '', description: '' },
});

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // `null` = closed, 'new' = create, otherwise the category being edited.
  const [editing, setEditing] = useState<CategoryWithDetails | 'new' | null>(null);
  const [toArchive, setToArchive] = useState<CategoryWithDetails | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCategories(await listCategories());
    } catch (e) {
      setLoadError(e instanceof AdminError ? e.message : 'Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (category: CategoryWithDetails, isActive: boolean) => {
    setBusy(true);
    try {
      await setCategoryActive(category.id, isActive);
      toast.success(isActive ? 'Catégorie remise en ligne.' : 'Catégorie archivée.');
      setToArchive(null);
      await load();
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Catégories"
        description="Les catégories en ligne apparaissent dans le menu, sur l’accueil et dans les filtres du catalogue."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" />
            Nouvelle catégorie
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          icon={AlertCircle}
          title="Chargement impossible"
          description={loadError}
          action={<Button onClick={load}>Réessayer</Button>}
          className="rounded-lg border border-line bg-white"
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucune catégorie"
          description="Les catégories organisent le catalogue et la navigation."
          action={<Button onClick={() => setEditing('new')}>Nouvelle catégorie</Button>}
          className="rounded-lg border border-line bg-white"
        />
      ) : (
        <ul className="rounded-lg border border-line bg-white divide-y divide-line">
          {categories.map((category) => {
            const name = categoryName(category, 'fr');
            return (
              <li key={category.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="relative w-12 h-12 shrink-0 rounded-sm overflow-hidden bg-surface-sunken">
                  {category.image_url ? (
                    <Image src={category.image_url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="grid place-items-center w-full h-full text-ink-tertiary">
                      <ImageOff size={15} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{name}</p>
                  <p className="text-caption text-ink-tertiary truncate">
                    /{category.slug} · ordre {category.sort_order}
                  </p>
                </div>
                {!category.is_active && <Badge variant="neutral">Archivée</Badge>}
                <div className="flex items-center shrink-0">
                  <IconButton label={`Modifier ${name}`} variant="subtle" onClick={() => setEditing(category)}>
                    <Pencil size={16} aria-hidden="true" />
                  </IconButton>
                  {category.is_active ? (
                    <IconButton label={`Archiver ${name}`} variant="danger" onClick={() => setToArchive(category)}>
                      <Archive size={16} aria-hidden="true" />
                    </IconButton>
                  ) : (
                    <IconButton
                      label={`Remettre ${name} en ligne`}
                      variant="subtle"
                      disabled={busy}
                      onClick={() => toggleActive(category, true)}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                    </IconButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!toArchive}
        onCancel={() => setToArchive(null)}
        onConfirm={() => toArchive && toggleActive(toArchive, false)}
        title="Archiver cette catégorie ?"
        description="Elle disparaît du menu et des filtres. Ses produits restent en ligne, sans catégorie affichée."
        confirmLabel="Archiver"
        cancelLabel="Annuler"
        tone="danger"
        busy={busy}
      />
    </>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [translations, setTranslations] = useState<Translations>(() => {
    const t = emptyTranslations();
    for (const locale of LOCALES) {
      const existing = category?.translations[locale];
      if (existing) t[locale] = { name: existing.name, description: existing.description ?? '' };
    }
    return t;
  });
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!category);
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
  const [tab, setTab] = useState<Locale>('fr');
  const [errors, setErrors] = useState<{ name?: string; slug?: string; sortOrder?: string }>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const firstName = LOCALES.map((l) => translations[l].name.trim()).find(Boolean) ?? '';

  const setTranslation = (locale: Locale, field: 'name' | 'description', value: string) => {
    const next = { ...translations, [locale]: { ...translations[locale], [field]: value } };
    setTranslations(next);
    if (!slugEdited && field === 'name') {
      setSlug(slugify(LOCALES.map((l) => next[l].name.trim()).find(Boolean) ?? ''));
    }
  };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setUploading(true);
    try {
      setImageUrl(await uploadCategoryImage(file));
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Échec de l’envoi de l’image.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const found: typeof errors = {};
    if (!firstName) found.name = 'Indiquez le nom dans au moins une langue.';
    if (!SLUG_PATTERN.test(slug)) found.slug = 'Lettres minuscules, chiffres et tirets uniquement.';
    if (!/^-?\d+$/.test(sortOrder.trim())) found.sortOrder = 'Nombre entier attendu.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await saveCategory({ slug, sortOrder: Number(sortOrder), isActive, imageUrl, translations }, category?.id);
      toast.success(category ? 'Catégorie enregistrée.' : 'Catégorie créée.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof AdminError ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      closeLabel="Fermer"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={() => submit()} disabled={saving || uploading}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-6">
        {errors.name && (
          <p role="alert" className="text-caption text-error">
            {errors.name}
          </p>
        )}
        <LocaleTabs value={tab} onChange={setTab} incomplete={LOCALES.filter((l) => !translations[l].name.trim())}>
          {(locale) => (
            <div className="space-y-4">
              <Field label="Nom">
                <Input
                  value={translations[locale].name}
                  onChange={(e) => setTranslation(locale, 'name', e.target.value)}
                  invalid={!!errors.name}
                />
              </Field>
              <Field label="Description" hint="Affichée en haut de la page de la catégorie.">
                <Textarea
                  rows={3}
                  value={translations[locale].description}
                  onChange={(e) => setTranslation(locale, 'description', e.target.value)}
                />
              </Field>
            </div>
          )}
        </LocaleTabs>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Adresse (slug)" error={errors.slug} hint={`/catalog?category=${slug || '…'}`} required>
            <Input
              value={slug}
              dir="ltr"
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
            />
          </Field>
          <Field label="Ordre d’affichage" error={errors.sortOrder}>
            <Input type="number" step="1" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
        </div>

        <div>
          <p className="text-small font-medium text-ink mb-1.5">Image</p>
          <div className="flex items-center gap-4">
            <div className="relative w-24 aspect-editorial shrink-0 rounded-md overflow-hidden bg-surface-sunken">
              {imageUrl ? (
                <Image src={imageUrl} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <span className="grid place-items-center w-full h-full text-ink-tertiary">
                  <ImageOff size={18} aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-line text-small text-ink cursor-pointer hover:border-ink focus-within:outline focus-within:outline-2 focus-within:outline-ink">
                <ImagePlus size={15} aria-hidden="true" />
                {uploading ? 'Envoi…' : imageUrl ? 'Remplacer' : 'Choisir une image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    void onImage(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="inline-flex items-center gap-2 text-small text-ink-secondary hover:text-error"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Retirer l’image
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-caption text-ink-tertiary">Format portrait conseillé (4:5). Sans image, une photo par défaut est utilisée.</p>
        </div>

        <Checkbox
          label="En ligne"
          hint="Décochez pour archiver la catégorie."
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      </form>
    </Dialog>
  );
}
