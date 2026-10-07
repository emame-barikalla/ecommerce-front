'use client';

import { useCallback, useState } from 'react';
import type { CategoryWithDetails } from '@/lib/types/database';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Cart from './Cart';

/**
 * Owns the single piece of shared chrome state — whether the cart drawer is
 * open. The announcement bar scrolls away; only the navbar sticks.
 */
export default function Navigation({
  categories,
  announcements,
}: {
  categories: CategoryWithDetails[];
  announcements: string[];
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <>
      <AnnouncementBar messages={announcements} />
      <Navbar categories={categories} onOpenCart={() => setIsCartOpen(true)} />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
