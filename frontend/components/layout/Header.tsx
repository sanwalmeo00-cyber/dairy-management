'use client';

import { Bell, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar, Button } from '@/components/ui';
import { mockNotifications } from '@/data/mock/dashboard';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentUser, switchPartner, users, logout, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;
  const switchableUsers = users.filter((u) => u.role === 'USER' && u.status !== 'Inactive');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleLogout() {
    const portal = isSuperAdmin ? 'superuser' : 'user';
    logout();
    window.location.href = portal === 'superuser' ? '/superuser/login' : '/login';
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-6">
      <button
        type="button"
        className="shrink-0 rounded-lg p-2 hover:bg-muted lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        <input
          placeholder="Search tags, sales, workers…"
          className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <div className="relative">
          <button
            type="button"
            className="relative rounded-lg p-2 hover:bg-muted"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </button>
          {notifOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 sm:hidden"
                aria-label="Close notifications"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-fg uppercase">
                  Notifications
                </p>
                <div className="max-h-[60vh] overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg px-3 py-2 ${n.read ? '' : 'bg-primary/5'}`}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-fg">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-fg">{n.timeAgo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex max-w-[10rem] items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-muted sm:max-w-none sm:px-2"
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
          >
            <Avatar name={currentUser.name} />
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-medium leading-none">{currentUser.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-fg">{currentUser.role}</p>
            </div>
          </button>
          {userOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 sm:hidden"
                aria-label="Close user menu"
                onClick={() => setUserOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-card p-2 shadow-lg">
                {!isSuperAdmin && (
                  <>
                    <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-fg uppercase">
                      Switch user (mock)
                    </p>
                    {switchableUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                          u.id === currentUser.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => {
                          switchPartner(u.id);
                          setUserOpen(false);
                          toast(`Switched to ${u.name}`, 'info');
                        }}
                      >
                        <Avatar name={u.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{u.name}</span>
                          <span className="block truncate text-xs text-muted-fg">{u.email}</span>
                        </span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-border" />
                  </>
                )}
                <Link
                  href="/settings"
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setUserOpen(false)}
                >
                  Settings
                </Link>
                {isSuperAdmin && (
                  <Link
                    href="/users"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setUserOpen(false)}
                  >
                    Manage Users
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
