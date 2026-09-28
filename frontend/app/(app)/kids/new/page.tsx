'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { kidsService } from '@/services/kids';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  PageHeader,
  Card,
  Input,
  Select,
  Textarea,
  Button,
  ImageUpload,
  LoadingState,
} from '@/components/ui';
import type { Goat, VaccinationStatus } from '@/types/farm';
import { normalizeGoatStatus } from '@/lib/goatStatus';

function isFemale(g: Goat) {
  return String(g.gender).trim().toLowerCase() === 'female';
}

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void goatsService
      .getAll()
      .then((herd) => {
        setGoats(herd);
        if (motherFromQuery && herd.some((g) => g.id === motherFromQuery)) {
          setMotherId(motherFromQuery);
        }
      })
      .catch((err) => {
        toast(err instanceof Error ? err.message : 'Failed to load animals', 'error');
        setGoats([]);
      })
      .finally(() => setLoading(false));
  }, [motherFromQuery, toast]);

  const females = useMemo(
    () =>
      goats
        .filter((g) => isFemale(g) && normalizeGoatStatus(g.status) !== 'Sold')
        .map((g) => {
          const status = normalizeGoatStatus(g.status);
          const pregnant = status === 'Pregnant' ? ' · Pregnant' : '';
          return { label: `${g.tagNumber}${pregnant}`, value: g.id };
        }),
    [goats]
  );

  const mother = goats.find((g) => g.id === motherId);
  const motherPregnant = mother && normalizeGoatStatus(mother.status) === 'Pregnant';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const selectedMother = String(fd.get('motherId') || motherId);
    if (!selectedMother) {
      toast('Select a mother', 'error');
      return;
    }
    setSaving(true);
    try {
      await kidsService.create({
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        gender: String(fd.get('gender')) as 'Male' | 'Female',
        dateOfBirth: String(fd.get('dateOfBirth')),
        motherId: selectedMother,
        fatherId: null,
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
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading animals…" />;
  }

  return (
    <div>
      <PageHeader
        title="Record Birth"
        description={`Adds the kid to Kids and to Animals for ${currentUser.name}.`}
      />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload
              folder="kids"
              value={imageUrl}
              onChange={setImageUrl}
              disabled={saving}
            />
          </div>
          <Select
            name="motherId"
            label="Mother"
            required
            options={females}
            placeholder={females.length ? 'Select mother' : 'No female animals available'}
            value={motherId}
            onChange={(e) => setMotherId(e.target.value)}
            disabled={saving || females.length === 0}
            className="sm:col-span-2"
          />
          {females.length === 0 && (
            <p className="sm:col-span-2 text-sm text-amber-800">
              No female animals found. Add a female animal first, then record the birth.
            </p>
          )}
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
          <Input
            name="tagNumber"
            label="Kid Tag Number"
            required
            placeholder="e.g. K001"
            disabled={saving}
          />
          <Select
            name="gender"
            label="Gender"
            required
            disabled={saving}
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
            max={new Date().toISOString().slice(0, 10)}
            disabled={saving}
            hint="Kid’s birth date (sets age on the animal record)"
          />
          <Input
            name="weight"
            label="Birth Weight (kg)"
            type="number"
            step="0.1"
            required
            disabled={saving}
          />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            defaultValue="Not Vaccinated"
            disabled={saving}
            options={(
              ['Not Vaccinated', 'Up to Date', 'Due', 'Overdue'] as VaccinationStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href={motherId ? `/goats/${motherId}` : '/kids'}>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} loadingText="Saving…" disabled={females.length === 0}>
              Save birth
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewKidPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <RecordBirthForm />
    </Suspense>
  );
}
