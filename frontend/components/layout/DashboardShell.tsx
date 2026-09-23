'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LoadingState } from '@/components/ui';

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      const portal =
        typeof window !== 'undefined' ? localStorage.getItem('gfms-portal') : null;
      const loginPath = portal === 'superuser' ? '/superuser/login' : '/login';
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, ready, router, pathname]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Preparing farm workspace…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
