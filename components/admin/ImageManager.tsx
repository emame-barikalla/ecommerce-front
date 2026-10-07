'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, X } from 'lucide-react';
import {
  AdminError,
  addProductImages,
  deleteImage,
  getProduct,
  reorderImages,
  setPrimaryImage,
  validateImage,
} from '@/lib/admin/api';
import { sortImages } from '@/lib/i18n/localize';
import type { ProductImage } from '@/lib/types/database';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils/cn';

function UploadButton({ onFiles, disabled, label }: { onFiles: (files: File[]) => void; disabled?: boolean; label: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          'grid place-items-center gap-1.5 aspect-square rounded-md border border-dashed border-line-strong text-center p-2',
          'text-caption text-ink-secondary cursor-pointer hover:border-ink hover:text-ink transition-colors',
          'focus-within:outline focus-within:outline-2 focus-within:outline-ink',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <span className="grid justify-items-center gap-1.5">
          <ImagePlus size={20} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </span>
      </label>
    </>
  );
}

/** Existing product: every action is saved immediately. */
export default function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ProductImage | null>(null);

  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await action();
      const fresh = await getProduct(productId);
      if (fresh) onChange(sortImages(fresh.images));
      if (success) toast.success(success);
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Action impossible sur l’image.');
    } finally {
      setBusy(false);
    }
  };

  const upload = (files: File[]) => {
    const invalid = files.map(validateImage).filter((m): m is string => !!m);
    invalid.forEach((m) => toast.error(m));
    const valid = files.filter((f) => !validateImage(f));
    if (!valid.length) return;
    void run(async () => {
      const failures = await addProductImages(productId, valid, images);
      failures.forEach((f) => toast.error(f));
    }, `${valid.length} image(s) ajoutée(s).`);
  };

  const move = (index: number, delta: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
    void run(() => reorderImages(next));
  };

  return (
    <>
      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3" aria-busy={busy}>
        {images.map((img, index) => (
          <li key={img.id} className="relative">
            <div
              className={cn(
                'relative aspect-square rounded-md overflow-hidden bg-surface-sunken',
                img.is_primary && 'ring-2 ring-ink ring-offset-2'
              )}
            >
              <Image src={img.image_url} alt={img.alt_text ?? ''} fill sizes="160px" className="object-cover" />
              {img.is_primary && (
                <span className="absolute top-1.5 start-1.5 rounded-xs bg-ink px-1.5 py-0.5 text-micro font-medium text-ink-inverse">
                  Principale
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              {/* The primary image always leads, so only the others reorder. */}
              <div className="flex">
                <IconButton
                  label="Déplacer à gauche"
                  size="sm"
                  variant="subtle"
                  disabled={busy || img.is_primary || index === 0 || (index === 1 && images[0].is_primary)}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Déplacer à droite"
                  size="sm"
                  variant="subtle"
                  disabled={busy || img.is_primary || index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight size={14} aria-hidden="true" />
                </IconButton>
              </div>
              <div className="flex">
                {!img.is_primary && (
                  <IconButton
                    label="Définir comme image principale"
                    size="sm"
                    variant="subtle"
                    disabled={busy}
                    onClick={() => run(() => setPrimaryImage(productId, img.id), 'Image principale modifiée.')}
                  >
                    <Star size={14} aria-hidden="true" />
                  </IconButton>
                )}
                <IconButton label="Supprimer l’image" size="sm" variant="danger" disabled={busy} onClick={() => setToDelete(img)}>
                  <Trash2 size={14} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
        <li>
          <UploadButton onFiles={upload} disabled={busy} label={busy ? 'Envoi…' : 'Ajouter des images'} />
        </li>
      </ul>

      <ConfirmDialog
        open={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (target) {
            void run(
              () => deleteImage(target, images.filter((i) => i.id !== target.id)),
              'Image supprimée.'
            );
          }
        }}
        title="Supprimer cette image ?"
        description="Elle sera retirée du produit et du stockage. Cette action est définitive."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
      />
    </>
  );
}

/** New product: files are queued locally and uploaded once the product exists. */
export function PendingImages({
  files,
  onChange,
  validate,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  validate: (file: File) => string | null;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const add = (incoming: File[]) => {
    incoming.map(validate).forEach((m) => m && toast.error(m));
    onChange([...files, ...incoming.filter((f) => !validate(f))]);
  };

  return (
    <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {files.map((file, index) => (
        <li key={previews[index]} className="relative">
          <div className={cn('relative aspect-square rounded-md overflow-hidden bg-surface-sunken', index === 0 && 'ring-2 ring-ink ring-offset-2')}>
            {/* Local object URL — next/image cannot optimise blob: sources */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previews[index]} alt="" className="w-full h-full object-cover" />
            {index === 0 && (
              <span className="absolute top-1.5 start-1.5 rounded-xs bg-ink px-1.5 py-0.5 text-micro font-medium text-ink-inverse">
                Principale
              </span>
            )}
          </div>
          <IconButton
            label={`Retirer ${file.name}`}
            size="sm"
            variant="overlay"
            onClick={() => onChange(files.filter((_, i) => i !== index))}
            className="absolute top-1 end-1 rounded-full"
          >
            <X size={14} aria-hidden="true" />
          </IconButton>
        </li>
      ))}
      <li>
        <UploadButton onFiles={add} label="Ajouter des images" />
      </li>
    </ul>
  );
}
