'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { AlertCircle, Archive, ImageOff, Package, Pencil, Plus, RotateCcw, Search, Star } from 'lucide-react';
import { AdminError, listCategories, listProducts, setProductActive } from '@/lib/admin/api';
import { AVAILABILITY_LABELS } from '@/lib/admin/labels';
import { categoryName, localizedName, primaryImage, searchableText } from '@/lib/i18n/localize';
import type { CategoryWithDetails, ProductWithDetails } from '@/lib/types/database';
import PageHeader from '@/components/admin/PageHeader';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/components/ui/Price';

type Status = 'active' | 'archived' | 'all';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<Status>('active');
  const [toArchive, setToArchive] = useState<ProductWithDetails | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [p, c] = await Promise.all([listProducts(), listCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      setLoadError(e instanceof AdminError ? e.message : 'Impossible de charger les produits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((p) => {
      if (status === 'active' && !p.is_active) return false;
      if (status === 'archived' && p.is_active) return false;
      if (category !== 'all' && p.category_id !== category) return false;
      return !needle || searchableText(p).includes(needle) || p.slug.includes(needle);
    });
  }, [products, search, category, status]);

  const toggleActive = async (product: ProductWithDetails, isActive: boolean) => {
    setBusy(true);
    try {
      await setProductActive(product.id, isActive);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: isActive } : p)));
      toast.success(isActive ? 'Produit remis en ligne.' : 'Produit archivé : il n’apparaît plus sur la boutique.');
      setToArchive(null);
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const counts = {
    active: products.filter((p) => p.is_active).length,
    archived: products.filter((p) => !p.is_active).length,
  };

  return (
    <>
      <PageHeader
        title="Produits"
        description="Les produits archivés disparaissent de la boutique mais restent récupérables."
        actions={
          <Link href="/admin/products/new" className={buttonStyles()}>
            <Plus size={16} aria-hidden="true" />
            Nouveau produit
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} aria-hidden="true" className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <label htmlFor="product-search" className="sr-only">
            Rechercher un produit
          </label>
          <Input
            id="product-search"
            type="search"
            placeholder="Rechercher (nom dans toutes les langues, adresse)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <label htmlFor="product-category" className="sr-only">
          Catégorie
        </label>
        <Select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className="md:w-52">
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryName(c, 'fr')}
              {c.is_active ? '' : ' (archivée)'}
            </option>
          ))}
        </Select>
        <label htmlFor="product-status" className="sr-only">
          Statut
        </label>
        <Select id="product-status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="md:w-44">
          <option value="active">En ligne ({counts.active})</option>
          <option value="archived">Archivés ({counts.archived})</option>
          <option value="all">Tous ({products.length})</option>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? 'Aucun produit' : 'Aucun résultat'}
          description={
            products.length === 0 ? 'Créez votre premier produit pour remplir la boutique.' : 'Modifiez la recherche ou les filtres.'
          }
          action={
            products.length === 0 ? (
              <Link href="/admin/products/new" className={buttonStyles()}>
                Nouveau produit
              </Link>
            ) : undefined
          }
          className="rounded-lg border border-line bg-white"
        />
      ) : (
        <ul className="rounded-lg border border-line bg-white divide-y divide-line">
          {visible.map((product) => {
            const image = primaryImage(product);
            const name = localizedName(product, 'fr', product.slug);
            return (
              <li key={product.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="relative w-12 h-14 shrink-0 rounded-sm overflow-hidden bg-surface-sunken">
                  {image ? (
                    <Image src={image.image_url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="grid place-items-center w-full h-full text-ink-tertiary">
                      <ImageOff size={15} aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-medium text-ink truncate hover:underline underline-offset-4"
                    >
                      {name}
                    </Link>
                    {product.is_featured && (
                      <Star size={13} aria-label="Vedette" className="shrink-0 fill-accent text-accent" />
                    )}
                  </div>
                  <p className="text-caption text-ink-tertiary truncate">
                    {product.category ? categoryName(product.category, 'fr') : 'Sans catégorie'}
                    {product.availability ? ` · ${AVAILABILITY_LABELS[product.availability]}` : ''}
                  </p>
                </div>

                <div className="hidden sm:block text-end shrink-0">
                  <p className="text-small tabular text-ink">{formatPrice(product.price)}</p>
                  {product.compare_at_price && (
                    <p className="text-caption tabular text-ink-tertiary line-through">
                      {formatPrice(product.compare_at_price)}
                    </p>
                  )}
                </div>

                {!product.is_active && <Badge variant="neutral">Archivé</Badge>}

                <div className="flex items-center shrink-0">
                  <Link
                    href={`/admin/products/${product.id}`}
                    aria-label={`Modifier ${name}`}
                    title="Modifier"
                    className="grid place-items-center w-11 h-11 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-sunken transition-colors"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Link>
                  {product.is_active ? (
                    <IconButton label={`Archiver ${name}`} variant="danger" onClick={() => setToArchive(product)}>
                      <Archive size={16} aria-hidden="true" />
                    </IconButton>
                  ) : (
                    <IconButton
                      label={`Remettre ${name} en ligne`}
                      variant="subtle"
                      disabled={busy}
                      onClick={() => toggleActive(product, true)}
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

      <ConfirmDialog
        open={!!toArchive}
        onCancel={() => setToArchive(null)}
        onConfirm={() => toArchive && toggleActive(toArchive, false)}
        title="Archiver ce produit ?"
        description={
          toArchive
            ? `« ${localizedName(toArchive, 'fr', toArchive.slug)} » ne sera plus visible sur la boutique. Vous pourrez le remettre en ligne à tout moment.`
            : undefined
        }
        confirmLabel="Archiver"
        cancelLabel="Annuler"
        tone="danger"
        busy={busy}
      />
    </>
  );
}
