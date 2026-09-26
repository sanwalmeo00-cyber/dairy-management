'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui';

/** Breeding removed — use Pregnant status + Record Birth under Kids. */
export default function BreedingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kids');
  }, [router]);
  return <LoadingState label="Redirecting to Kids…" />;
}
