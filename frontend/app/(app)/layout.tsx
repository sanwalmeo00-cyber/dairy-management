import { DashboardShell } from '@/components/layout/DashboardShell';
import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
