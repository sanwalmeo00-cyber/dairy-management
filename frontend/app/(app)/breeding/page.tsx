'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Breeding removed — use Pregnant status + Record Birth under Kids. */
export default function BreedingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kids');
  }, [router]);
  return <p className="text-sm text-muted-fg">Redirecting to Kids…</p>;
}
