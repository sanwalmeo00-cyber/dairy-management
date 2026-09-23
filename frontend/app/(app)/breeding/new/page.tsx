'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Select, Input, Textarea, Button } from '@/components/ui';

export default function NewBreedingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [goats, setGoats] = useState(mockGoats);

  useEffect(() => {
    setGoats(mockGoats);
  }, []);

  const females = useMemo(
    () => goats.filter((g) => g.gender === 'Female').map((g) => ({ label: g.name, value: g.id })),
    [goats]
  );
  const males = useMemo(
    () => goats.filter((g) => g.gender === 'Male').map((g) => ({ label: g.name, value: g.id })),
    [goats]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast(`Breeding saved for ${currentUser.name} (mock)`);
    router.push('/breeding');
  };

  return (
    <div>
      <PageHeader title="Plan Breeding" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Select name="femaleGoatId" label="Female" required options={females} placeholder="Select female" />
          <Select name="maleGoatId" label="Male" required options={males} placeholder="Select male" />
          <Input name="breedingDate" label="Breeding Date" type="date" required />
          <Input name="expectedDueDate" label="Expected Due Date" type="date" required />
          <Select
            name="status"
            label="Status"
            required
            options={['Planned', 'Pregnant', 'Completed', 'Failed'].map((s) => ({ label: s, value: s }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/breeding">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
