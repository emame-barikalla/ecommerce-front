'use client';

import { useParams } from 'next/navigation';
import ProductEditor from '@/components/admin/ProductEditor';

/** `/admin/products/new` creates; `/admin/products/<uuid>` edits. */
export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductEditor key={id} productId={id === 'new' ? null : id} />;
}
