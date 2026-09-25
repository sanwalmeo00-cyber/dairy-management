'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BreedingDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kids');
  }, [router]);
  return <p className="text-sm text-muted-fg">Redirecting to Kids…</p>;
}
