'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Rabbit,
  HeartHandshake,
  Baby,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Users,
  Package,
  Settings,
  Trash2,
  UserCog,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();

  const nav = [
    {
      label: 'Main',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/goats', label: 'Animals', icon: Rabbit },
        { href: '/breeding', label: 'Breeding', icon: HeartHandshake },
        { href: '/kids', label: 'Kids', icon: Baby },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/goat-purchases', label: 'Animal Purchases', icon: ShoppingBag },
        { href: '/sales', label: 'Sales', icon: TrendingUp },
        { href: '/expenses', label: 'Expenses', icon: Wallet },
      ],
    },
    {
      label: 'Management',
      items: [
        { href: '/workers', label: 'Workers', icon: Users },
        { href: '/inventory', label: 'Inventory', icon: Package },
        ...(isSuperAdmin
          ? [{ href: '/users', label: 'Users', icon: UserCog }]
          : []),
        { href: '/deleted', label: 'Deleted', icon: Trash2 },
      ],
    },
    {
      label: 'System',
      items: [{ href: '/settings', label: 'Settings', icon: Settings }],
    },
  ];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-sidebar text-sidebar-fg transition-transform',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide text-white sm:text-xl">
              SMS DAIRY FARM
            </p>
            <p className="truncate text-xs text-sidebar-muted">
              {isSuperAdmin ? 'Super Admin' : 'Dairy Farm Management'}
            </p>
          </div>
          <button type="button" className="shrink-0 lg:hidden" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {nav.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                          active
                            ? 'bg-sidebar-active text-white'
                            : 'text-sidebar-fg/85 hover:bg-white/5'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
