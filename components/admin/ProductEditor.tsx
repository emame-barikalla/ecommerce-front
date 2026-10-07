'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import {
  AdminError,
  SLUG_PATTERN,
  addProductImages,
  getProduct,
  listCategories,
  saveProduct,
  slugify,
  validateImage,
  type ProductInput,
} from '@/lib/admin/api';
import { AVAILABILITY_LABELS, GENDER_LABELS } from '@/lib/admin/labels';
import { LOCALES } from '@/lib/config';
import { categoryName, sortImages } from '@/lib/i18n/localize';
import {
  AVAILABILITIES,
  GENDERS,
  type Availability,
  type CategoryWithDetails,
  type Gender,
  type Locale,
  type ProductImage,
} from '@/lib/types/database';
import PageHeader from '@/components/admin/PageHeader';
import LocaleTabs from '@/components/admin/LocaleTabs';
import ImageManager, { PendingImages } from '@/components/admin/ImageManager';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Translations = ProductInput['translations'];

const emptyTranslations = (): Translations => ({
  en: { name: '', description: '' },
  fr: { name: '', description: '' },
  ar: { name: '', description: '' },
});

interface FormState {
  translations: Translations;
  slug: string;
  price: string;
  compareAt: string;
  /** Empty string = not specified (nothing shown on the storefront). */
  availability: Availability | '';
  /** Optional size / volume — empty when not relevant. */
  size: string;
  /** Empty string = not assigned (listed under both departments). */
  gender: Gender | '';
  categoryId: string;
  sortOrder: string;
  isFeatured: boolean;
  isActive: boolean;
}

const INITIAL: FormState = {
  translations: emptyTranslations(),
  slug: '',
  price: '',
  compareAt: '',
  availability: '',
  size: '',
  gender: '',
  categoryId: '',
  sortOrder: '0',
  isFeatured: false,
  isActive: true,
};

type Errors = Partial<Record<'name' | 'slug' | 'price' | 'compareAt' | 'sortOrder', string>>;

function firstName(translations: Translations) {
  return LOCALES.map((l) => translations[l].name.trim()).find(Boolean) ?? '';
}

export default function ProductEditor({ productId }: { productId: string | null }) {
  const router = useRouter();
  const isNew = productId === null;

  const [form, setForm] = useState<FormState>(INITIAL);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [originalSlug, setOriginalSlug] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [tab, setTab] = useState<Locale>('fr');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cats, product] = await Promise.all([listCategories(), productId ? getProduct(productId) : null]);
      setCategories(cats);
      if (productId && !product) {
        setLoadError('Ce produit n’existe pas ou a été supprimé.');
        return;
      }
      if (product) {
        const translations = emptyTranslations();
        for (const locale of LOCALES) {
          const t = product.translations[locale];
          if (t) translations[locale] = { name: t.name, description: t.description ?? '' };
        }
        setForm({
          translations,
          slug: product.slug,
          price: String(product.price),
          compareAt: product.compare_at_price ? String(product.compare_at_price) : '',
          availability: product.availability ?? '',
          size: product.size ?? '',
          gender: product.gender ?? '',
          categoryId: product.category_id ?? '',
          sortOrder: String(product.sort_order ?? 0),
          isFeatured: !!product.is_featured,
          isActive: product.is_active,
        });
        setOriginalSlug(product.slug);
        setImages(sortImages(product.images));
      }
    } catch (e) {
      setLoadError(e instanceof AdminError ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setTranslation = (locale: Locale, field: 'name' | 'description', value: string) => {
    setForm((f) => {
      const translations = { ...f.translations, [locale]: { ...f.translations[locale], [field]: value } };
      // The slug follows the name until the admin edits it by hand.
      const slug = !slugEdited && field === 'name' ? slugify(firstName(translations)) : f.slug;
      return { ...f, translations, slug };
    });
  };

  const incomplete = useMemo(
    () => LOCALES.filter((l) => !form.translations[l].name.trim()),
    [form.translations]
  );

  const validate = (): Errors => {
    const e: Errors = {};
    if (!firstName(form.translations)) e.name = 'Indiquez le nom du produit dans au moins une langue.';
    if (!SLUG_PATTERN.test(form.slug)) e.slug = 'Lettres minuscules, chiffres et tirets uniquement (ex. : sac-cuir-noir).';
    const price = Number(form.price);
    if (!form.price.trim() || !Number.isFinite(price) || price <= 0) e.price = 'Indiquez un prix supérieur à 0.';
    if (form.compareAt.trim()) {
      const compare = Number(form.compareAt);
      if (!Number.isFinite(compare) || compare <= price) e.compareAt = 'L’ancien prix doit être supérieur au prix actuel.';
    }
    if (!/^-?\d+$/.test(form.sortOrder.trim())) e.sortOrder = 'Nombre entier attendu.';
    return e;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Corrigez les champs signalés.');
      return;
    }

    setSaving(true);
    try {
      const id = await saveProduct(
        {
          translations: form.translations,
          slug: form.slug,
          price: Number(form.price),
          compareAtPrice: form.compareAt.trim() ? Number(form.compareAt) : null,
          availability: form.availability || null,
          size: form.size.trim() || null,
          gender: form.gender || null,
          categoryId: form.categoryId || null,
          sortOrder: Number(form.sortOrder),
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        },
        productId ?? undefined
      );

      if (isNew) {
        if (pending.length) {
          const failures = await addProductImages(id, pending, []);
          failures.forEach((f) => toast.error(f));
        }
        toast.success('Produit créé.');
        router.replace(`/admin/products/${id}`);
      } else {
        setOriginalSlug(form.slug);
        toast.success('Modifications enregistrées.');
      }
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Produit indisponible"
        description={loadError}
        action={
          <Link href="/admin/products" className={buttonStyles()}>
            Retour aux produits
          </Link>
        }
        className="rounded-lg border border-line bg-white"
      />
    );
  }

  const sectionClass = 'rounded-lg border border-line bg-white p-5 md:p-6';

  return (
    <form onSubmit={submit} noValidate>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 mb-4 text-small text-ink-secondary hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Produits
      </Link>
      <PageHeader
        title={isNew ? 'Nouveau produit' : firstName(form.translations) || 'Produit'}
        actions={
          !isNew &&
          form.isActive && (
            <a
              href={`/fr/catalog/${originalSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: 'outline' })}
            >
              <ExternalLink size={15} aria-hidden="true" />
              Voir sur la boutique
            </a>
          )
        }
      />

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section className={sectionClass} aria-labelledby="sec-content">
            <h2 id="sec-content" className="text-body font-medium text-ink">
              Nom et description
            </h2>
            <p className="t-small mt-1 mb-4">
              Renseignez chaque langue. Une langue vide affiche la version anglaise (ou une autre disponible).
            </p>
            {errors.name && (
              <p role="alert" className="mb-3 text-caption text-error">
                {errors.name}
              </p>
            )}
            <LocaleTabs value={tab} onChange={setTab} incomplete={incomplete}>
              {(locale) => (
                <div className="space-y-5">
                  <Field label="Nom">
                    <Input
                      value={form.translations[locale].name}
                      onChange={(e) => setTranslation(locale, 'name', e.target.value)}
                      maxLength={160}
                      invalid={!!errors.name}
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea
                      rows={6}
                      value={form.translations[locale].description}
                      onChange={(e) => setTranslation(locale, 'description', e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </LocaleTabs>
          </section>

          <section className={sectionClass} aria-labelledby="sec-images">
            <h2 id="sec-images" className="text-body font-medium text-ink">
              Images
            </h2>
            <p className="t-small mt-1 mb-4">
              L’image principale apparaît dans le catalogue. JPEG, PNG ou WebP, 5 Mo maximum.
            </p>
            {isNew ? (
              <PendingImages files={pending} onChange={setPending} validate={validateImage} />
            ) : (
              <ImageManager productId={productId} images={images} onChange={setImages} />
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={sectionClass} aria-labelledby="sec-status">
            <h2 id="sec-status" className="text-body font-medium text-ink mb-4">
              Publication
            </h2>
            <div className="space-y-4">
              <Checkbox
                label="En ligne"
                hint="Décochez pour archiver : le produit disparaît de la boutique."
                checked={form.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
              />
              <Checkbox
                label="Produit vedette"
                hint="Mis en avant sur la page d’accueil."
                checked={form.isFeatured}
                onChange={(e) => update('isFeatured', e.target.checked)}
              />
            </div>
          </section>

          <section className={sectionClass} aria-labelledby="sec-price">
            <h2 id="sec-price" className="text-body font-medium text-ink mb-4">
              Prix et disponibilité
            </h2>
            <div className="space-y-4">
              <Field label="Prix (MRU)" error={errors.price} required>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                />
              </Field>
              <Field
                label="Ancien prix (MRU)"
                hint="Facultatif. Affiché barré, avec le pourcentage de réduction."
                error={errors.compareAt}
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.compareAt}
                  onChange={(e) => update('compareAt', e.target.value)}
                />
              </Field>
              <Field
                label="Taille / Contenance"
                hint="Facultatif. Ex. : M (sac), 42 (chaussures), 50 ML (soin). Plusieurs valeurs : 41, 42, 43."
              >
                <Input
                  value={form.size}
                  maxLength={60}
                  dir="ltr"
                  placeholder="M · 42 · 50 ML"
                  onChange={(e) => update('size', e.target.value)}
                />
              </Field>
              <Field
                label="Disponibilité"
                hint="En stock = déjà en Mauritanie (livraison en 1 jour). Sur commande ou non précisée = commandé en Espagne (délai Espagne affiché). « Rupture » empêche l’ajout au panier."
              >
                <Select
                  value={form.availability}
                  onChange={(e) => update('availability', e.target.value as Availability | '')}
                >
                  <option value="">Non précisée (commande depuis l’Espagne)</option>
                  {AVAILABILITIES.map((a) => (
                    <option key={a} value={a}>
                      {AVAILABILITY_LABELS[a]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section className={sectionClass} aria-labelledby="sec-org">
            <h2 id="sec-org" className="text-body font-medium text-ink mb-4">
              Organisation
            </h2>
            <div className="space-y-4">
              <Field label="Rayon" hint="Femme ou Homme — la navigation principale de la boutique.">
                <Select value={form.gender} onChange={(e) => update('gender', e.target.value as Gender | '')}>
                  <option value="">Non précisé (affiché dans les deux rayons)</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABELS[g]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Catégorie">
                <Select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
                  <option value="">Sans catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryName(c, 'fr')}
                      {c.is_active ? '' : ' (archivée)'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ordre d’affichage" hint="Les plus petits nombres apparaissent en premier." error={errors.sortOrder}>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  value={form.sortOrder}
                  onChange={(e) => update('sortOrder', e.target.value)}
                />
              </Field>
              <Field
                label="Adresse (slug)"
                hint={
                  !isNew && form.slug !== originalSlug
                    ? 'Attention : l’ancienne adresse ne fonctionnera plus (liens partagés, référencement).'
                    : `Adresse de la page : /catalog/${form.slug || '…'}`
                }
                error={errors.slug}
                required
              >
                <Input
                  value={form.slug}
                  dir="ltr"
                  onChange={(e) => {
                    setSlugEdited(true);
                    update('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                />
              </Field>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky action bar: the form is long, saving must stay one tap away. */}
      <div
        className="sticky bottom-0 z-header -mx-4 sm:-mx-6 lg:mx-0 mt-8 px-4 sm:px-6 lg:px-0 py-4 bg-surface-subtle/95 backdrop-blur-md border-t border-line lg:border-0 flex justify-end gap-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Link href="/admin/products" className={buttonStyles({ variant: 'outline' })}>
          Annuler
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
