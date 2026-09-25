'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Single login page for all roles (including Super Admin). */
export default function SuperuserLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return <p className="p-6 text-sm text-muted-fg">Redirecting to login…</p>;
}
