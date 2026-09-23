'use client';

import { AuthProvider } from '@/context/AuthContext';
import { SoftDeleteProvider } from '@/context/SoftDeleteContext';
import { ToastProvider } from '@/context/ToastContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SoftDeleteProvider>
        <ToastProvider>{children}</ToastProvider>
      </SoftDeleteProvider>
    </AuthProvider>
  );
}
