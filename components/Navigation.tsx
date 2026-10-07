'use client';

import { useCallback, useState } from 'react';
import type { CategoryWithDetails } from '@/lib/types/database';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Cart from './Cart';
import BottomNav from './BottomNav';
import AccountSheet from './AccountSheet';

/**
 * Owns the shared chrome state — the cart drawer and the account sheet — so
 * the header (desktop) and the bottom navigation (mobile) open the same ones.
 * The announcement bar scrolls away; only the navbar sticks.
 */
export default function Navigation({
  categories,
  announcements,
}: {
  categories: CategoryWithDetails[];
  announcements: string[];
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const closeAccount = useCallback(() => setIsAccountOpen(false), []);
  const openCart = useCallback(() => {
    setIsAccountOpen(false);
    setIsCartOpen(true);
  }, []);
  const openAccount = useCallback(() => {
    setIsCartOpen(false);
    setIsAccountOpen(true);
  }, []);

  return (
    <>
      <AnnouncementBar messages={announcements} />
      <Navbar categories={categories} onOpenCart={openCart} />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
      <AccountSheet open={isAccountOpen} onClose={closeAccount} />
      <BottomNav
        onOpenCart={openCart}
        onOpenAccount={openAccount}
        cartOpen={isCartOpen}
        accountOpen={isAccountOpen}
      />
    </>
  );
}
