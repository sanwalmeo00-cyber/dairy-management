'use client';

import { Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Button } from '@/components/ui';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentUser, logout, isSuperAdmin } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUserOpen(false);
      }
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (userOpen && userRef.current && !userRef.current.contains(target)) {
        setUserOpen(false);
      }
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [userOpen]);

  function handleLogout() {
    const portal = isSuperAdmin ? 'superuser' : 'user';
    logout();
    window.location.href = portal === 'superuser' ? '/superuser/login' : '/login';
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-6">
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted active:bg-muted lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <div className="relative" ref={userRef}>
          <button
            type="button"
            className="flex max-w-[10rem] items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-muted sm:max-w-none sm:px-2"
            onClick={() => setUserOpen((v) => !v)}
            aria-expanded={userOpen}
          >
            <Avatar name={currentUser.name} />
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-medium leading-none">{currentUser.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-fg">{currentUser.role}</p>
            </div>
          </button>
          {userOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-card p-2 shadow-lg">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                <Avatar name={currentUser.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{currentUser.name}</span>
                  <span className="block truncate text-xs text-muted-fg">{currentUser.email}</span>
                </span>
              </div>
              <div className="my-1 border-t border-border" />
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
          )}
        </div>
      </div>
    </header>
  );
}
