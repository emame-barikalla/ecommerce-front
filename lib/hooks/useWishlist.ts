'use client';

import { useCallback, useSyncExternalStore } from 'react';

const WISHLIST_KEY = 'ecommerce_wishlist';
const EMPTY: string[] = [];

// One module-level store, so every heart on the page (cards, product page)
// reflects the same state instead of each holding its own copy.
let snapshot: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (snapshot) return snapshot;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    snapshot = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    snapshot = [];
  }
  return snapshot;
}

function write(next: string[]) {
  snapshot = next;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — keep the in-memory state for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== WISHLIST_KEY) return;
    snapshot = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useWishlist() {
  // The server snapshot is empty, so hearts render unfilled until hydration.
  const wishlist = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((productId: string) => {
    const current = read();
    write(current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }, []);

  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  return { wishlist, toggle, isWishlisted };
}
