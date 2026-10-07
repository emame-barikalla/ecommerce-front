'use client';

import { useEffect } from 'react';
import { trackRecentlyViewed } from '@/components/sections/RecentlyViewed';

export default function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackRecentlyViewed(productId);
  }, [productId]);

  return null;
}
