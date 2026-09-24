'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { breedingService } from '@/services/breeding';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Select, Input, Textarea, Button } from '@/components/ui';
import type { Goat } from '@/types/farm';

export default function NewBreedingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [goats, setGoats] = useState<Goat[]>([]);

  useEffect(() => {
    void goatsService.getAll().then(setGoats).catch(() => setGoats([]));
  }, []);

  const females = useMemo(
    () =>
      goats
        .filter((g) => g.gender === 'Female')
        .map((g) => ({ label: g.tagNumber, value: g.id })),
    [goats]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await breedingService.create({
        femaleGoatId: String(fd.get('femaleGoatId')),
        breedingDate: String(fd.get('breedingDate')),
        expectedDueDate: String(fd.get('expectedDueDate')),
        status: String(fd.get('status')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Breeding saved for ${currentUser.name}`);
      router.push('/breeding');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save breeding', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Plan Breeding" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Select
            name="femaleGoatId"
            label="Female"
            required
            options={females}
            placeholder="Select female"
          />
          <Input name="breedingDate" label="Breeding Date" type="date" required />
          <Input name="expectedDueDate" label="Expected Due Date" type="date" required />
          <Select
            name="status"
            label="Status"
            required
            options={['Planned', 'Pregnant', 'Completed', 'Failed'].map((s) => ({
              label: s,
              value: s,
            }))}
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
