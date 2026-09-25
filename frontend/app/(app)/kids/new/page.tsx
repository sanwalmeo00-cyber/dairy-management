'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { kidsService } from '@/services/kids';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button, ImageUpload } from '@/components/ui';
import type { Goat, VaccinationStatus } from '@/types/farm';
import { normalizeGoatStatus } from '@/lib/goatStatus';

function RecordBirthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motherFromQuery = searchParams.get('motherId') ?? '';
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [goats, setGoats] = useState<Goat[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [motherId, setMotherId] = useState(motherFromQuery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void goatsService.getAll().then(setGoats).catch(() => setGoats([]));
  }, []);

  useEffect(() => {
    if (motherFromQuery) setMotherId(motherFromQuery);
  }, [motherFromQuery]);

  const females = useMemo(
    () =>
      goats
        .filter((g) => g.gender === 'Female' && normalizeGoatStatus(g.status) !== 'Sold')
        .map((g) => {
          const status = normalizeGoatStatus(g.status);
          const pregnant = status === 'Pregnant' ? ' · Pregnant' : '';
          return { label: `${g.tagNumber}${pregnant}`, value: g.id };
        }),
    [goats]
  );

  const males = useMemo(
    () =>
      goats
        .filter((g) => g.gender === 'Male' && normalizeGoatStatus(g.status) !== 'Sold')
        .map((g) => ({ label: g.tagNumber, value: g.id })),
    [goats]
  );

  const mother = goats.find((g) => g.id === motherId);
  const motherPregnant = mother && normalizeGoatStatus(mother.status) === 'Pregnant';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await kidsService.create({
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        gender: String(fd.get('gender')) as 'Male' | 'Female',
        dateOfBirth: String(fd.get('dateOfBirth')),
        motherId: String(fd.get('motherId') || motherId),
        fatherId: String(fd.get('fatherId') || '') || null,
        weight: Number(fd.get('weight')),
        vaccinationStatus: String(fd.get('vaccinationStatus') || 'Not Vaccinated'),
        status: 'Healthy',
        imageUrl,
        notes: String(fd.get('notes') ?? '') || null,
        clearMotherPregnancy: true,
      });
      toast('Birth recorded — kid added to Kids and Animals');
      router.push('/kids');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record birth', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Record Birth"
        description="Adds the kid to Kids and to Animals. If the mother is Pregnant, she returns to Healthy."
      />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload folder="kids" value={imageUrl} onChange={setImageUrl} />
          </div>
          <Select
            name="motherId"
            label="Mother"
            required
            options={females}
            placeholder="Select mother"
            value={motherId}
            onChange={(e) => setMotherId(e.target.value)}
          />
          <Select
            name="fatherId"
            label="Father (optional)"
            options={males}
            placeholder="Select father"
          />
          {mother && !motherPregnant && (
            <p className="sm:col-span-2 text-sm text-amber-800">
              Mother {mother.tagNumber} is not marked Pregnant. You can still record the birth;
              set her status to Pregnant next time for a clearer workflow.
            </p>
          )}
          {motherPregnant && (
            <p className="sm:col-span-2 text-sm text-emerald-800">
              Mother is Pregnant — after save her status will change to Healthy.
            </p>
          )}
          <Input name="tagNumber" label="Kid Tag Number" required placeholder="e.g. K001" />
          <Select
            name="gender"
            label="Gender"
            required
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
          />
          <Input
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <Input name="weight" label="Birth Weight (kg)" type="number" step="0.1" required />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            defaultValue="Not Vaccinated"
            options={(
              ['Not Vaccinated', 'Up to Date', 'Due', 'Overdue'] as VaccinationStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href={motherId ? `/goats/${motherId}` : '/kids'}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save birth'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewKidPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-fg">Loading…</p>}>
      <RecordBirthForm />
    </Suspense>
  );
}
