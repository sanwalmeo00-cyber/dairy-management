'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui';

export default function LegacyGoatPurchasesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cashbook');
  }, [router]);
  return <LoadingState label="Redirecting to cashbook…" />;
}
