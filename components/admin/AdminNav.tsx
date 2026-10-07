'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Package, Settings, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Drawer from '@/components/ui/Drawer';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/categories', label: 'Catégories', icon: Tag },
  { href: '/admin/messages', label: 'Messages', icon: Inbox },
  { href: '/admin/settings', label: 'Réglages', icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await createClient().auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full">
      <nav aria-label="Administration" className="flex-1">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 h-11 rounded-md text-sm transition-colors',
                    active ? 'bg-surface-sunken text-ink font-medium' : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                  )}
                >
                  <item.icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-4 mt-4 border-t border-line space-y-0.5">
        <a
          href="/fr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 h-11 rounded-md text-sm text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-colors"
        >
          <ExternalLink size={17} strokeWidth={1.75} aria-hidden="true" />
          Voir la boutique
        </a>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm text-ink-secondary hover:bg-error-subtle hover:text-error transition-colors"
        >
          <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/** Fixed sidebar on desktop; top bar + drawer below `lg` (it used to vanish). */
export default function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-e border-line p-4">
        <div className="px-3 pt-1 pb-6">
          <p className="font-display text-xl leading-none text-ink">Administration</p>
        </div>
        <NavList />
      </aside>

      <header className="lg:hidden sticky top-0 z-header flex items-center gap-2 h-14 px-3 bg-white border-b border-line">
        <IconButton label="Ouvrir le menu" onClick={() => setOpen(true)} aria-expanded={open}>
          <Menu size={20} aria-hidden="true" />
        </IconButton>
        <p className="font-display text-lg text-ink">Administration</p>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} title="Menu" closeLabel="Fermer le menu" side="start">
        <div className="p-4 h-full">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
