'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Availability, Locale, ProductWithDetails } from '@/lib/types/database';
import { primaryImage } from '@/lib/i18n/localize';
import { getProductsByIds } from '@/lib/utils/supabase';

/**
 * What the cart keeps per product: just enough to render a line without a
 * network round-trip. It is a *snapshot* — `refresh()` reconciles it with the
 * database before checkout so a changed price or a withdrawn product is never
 * ordered from stale localStorage data.
 */
export interface CartProduct {
  id: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  availability: Availability | null;
  names: Partial<Record<Locale, string>>;
  image: { url: string; alt: string | null } | null;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export type CartIssue = 'unavailable' | 'priceChanged';

const STORAGE_KEY = 'ecommerce_cart_v2';
const LEGACY_STORAGE_KEY = 'ecommerce_cart';
export const MAX_QUANTITY = 99;

export function toCartProduct(product: ProductWithDetails): CartProduct {
  const image = primaryImage(product);
  const names: Partial<Record<Locale, string>> = {};
  for (const [locale, t] of Object.entries(product.translations)) {
    if (t?.name) names[locale as Locale] = t.name;
  }
  return {
    id: product.id,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compare_at_price ?? null,
    availability: product.availability ?? null,
    names,
    image: image ? { url: image.image_url, alt: image.alt_text ?? null } : null,
  };
}

export function cartProductName(product: CartProduct, locale: Locale): string {
  return product.names[locale] || product.names.en || product.names.fr || product.names.ar || product.slug;
}

const clamp = (q: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.floor(q)));

function isCartItem(value: unknown): value is CartItem {
  const v = value as CartItem;
  return !!v?.product?.id && typeof v.product.price === 'number' && typeof v.quantity === 'number';
}

/** Reads the current format, or converts the pre-v2 format (full product objects). */
function readStoredCart(): CartItem[] {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) {
    const parsed: unknown = JSON.parse(current);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  const parsed: unknown = JSON.parse(legacy);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((i): i is { product: ProductWithDetails; quantity: number } => !!i?.product?.id)
    .map((i) => ({
      product: toCartProduct({ ...i.product, images: i.product.images ?? [], translations: i.product.translations ?? {} }),
      quantity: clamp(i.quantity),
    }));
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [issues, setIssues] = useState<Record<string, CartIssue>>({});
  const [syncing, setSyncing] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    try {
      setCart(readStoredCart());
    } catch {
      // Corrupt storage: start with an empty cart rather than crash the page.
      setCart([]);
    } finally {
      setIsLoaded(true);
    }

    // Keep several open tabs in step.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setCart(readStoredCart());
      } catch {
        setCart([]);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Quota or private mode — the in-memory cart still works for this visit.
    }
  }, [cart, isLoaded]);

  const addToCart = useCallback((product: ProductWithDetails, quantity = 1) => {
    const snapshot = toCartProduct(product);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { product: snapshot, quantity: clamp(i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product: snapshot, quantity: clamp(quantity) }];
    });
    setIssues((prev) => {
      if (!prev[product.id]) return prev;
      const { [product.id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    setIssues((prev) => {
      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: clamp(quantity) } : i))
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setIssues({});
  }, []);

  /**
   * Re-reads every cart product from the database: prices are updated,
   * withdrawn or out-of-stock products are flagged. Returns the issues found,
   * or `null` if the check itself failed (network, etc.).
   */
  const refresh = useCallback(async (): Promise<Record<string, CartIssue> | null> => {
    const items = cartRef.current;
    if (items.length === 0) return {};
    setSyncing(true);
    try {
      const fresh = await getProductsByIds(items.map((i) => i.product.id));
      const byId = new Map(fresh.map((p) => [p.id, p]));
      const found: Record<string, CartIssue> = {};
      const snapshots = new Map<string, CartProduct>();

      // Computed outside the state updater: React may run updaters lazily, so
      // `found` must not depend on one having executed.
      for (const item of items) {
        const current = byId.get(item.product.id);
        if (!current || current.availability === 'out_of_stock') {
          found[item.product.id] = 'unavailable';
          continue;
        }
        if (current.price !== item.product.price) found[item.product.id] = 'priceChanged';
        snapshots.set(current.id, toCartProduct(current));
      }

      // Quantities come from `prev`, so an edit made during the request survives.
      setCart((prev) =>
        prev.map((item) => {
          const snapshot = snapshots.get(item.product.id);
          return snapshot ? { ...item, product: snapshot } : item;
        })
      );
      setIssues(found);
      return found;
    } catch (error) {
      console.error('[cart] refresh failed', error);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  const derived = useMemo(() => {
    const orderable = cart.filter((i) => issues[i.product.id] !== 'unavailable');
    return {
      orderableItems: orderable,
      totalItems: cart.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: orderable.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    };
  }, [cart, issues]);

  return {
    cart,
    isLoaded,
    issues,
    syncing,
    ...derived,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refresh,
  };
}
