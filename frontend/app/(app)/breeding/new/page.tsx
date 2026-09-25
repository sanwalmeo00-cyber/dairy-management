'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BreedingNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kids/new');
  }, [router]);
  return <p className="text-sm text-muted-fg">Redirecting to Record Birth…</p>;
}
