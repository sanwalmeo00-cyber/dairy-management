'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Public self-registration disabled — Super Admin creates user accounts. */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return <p className="p-6 text-center text-sm text-muted-fg">Redirecting to login…</p>;
}
