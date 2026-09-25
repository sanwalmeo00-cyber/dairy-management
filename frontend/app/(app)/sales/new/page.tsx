'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacySalesNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cashbook/new?type=sale');
  }, [router]);
  return <p className="text-sm text-muted-fg">Redirecting to cashbook…</p>;
}
