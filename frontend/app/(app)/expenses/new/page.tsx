'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyExpensesNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cashbook/new?type=expense');
  }, [router]);
  return <p className="text-sm text-muted-fg">Redirecting to cashbook…</p>;
}
