import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '../globals.css';
import AdminShell from '@/components/admin/AdminShell';
import ToastProvider from '@/components/ToastProvider';
import { fontVariables } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

// The admin is its own root layout (the storefront's lives in app/[locale]),
// so each can stamp the correct `lang`/`dir` on <html> server-side.
// Access control lives in middleware.ts (session + admin-role check); this
// layout only picks between the bare login screen and the full shell, using
// the `x-pathname` header the middleware sets.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') || '';
  const isLogin = pathname.startsWith('/admin/login');

  return (
    <html lang="fr" dir="ltr" className={fontVariables}>
      <body className="font-sans antialiased bg-surface-subtle">
        {isLogin ? children : <AdminShell>{children}</AdminShell>}
        <ToastProvider dir="ltr" />
      </body>
    </html>
  );
}
