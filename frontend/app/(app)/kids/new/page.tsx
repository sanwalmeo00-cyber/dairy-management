'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { kidsService } from '@/services/kids';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button, ImageUpload } from '@/components/ui';
import type { Goat, GoatStatus, HealthStatus, VaccinationStatus } from '@/types/farm';

export default function NewKidPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [goats, setGoats] = useState<Goat[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void goatsService.getAll().then(setGoats).catch(() => setGoats([]));
  }, []);

  const females = goats
    .filter((g) => g.gender === 'Female')
    .map((g) => ({ label: g.tagNumber, value: g.id }));
  const males = goats
    .filter((g) => g.gender === 'Male')
    .map((g) => ({ label: g.tagNumber, value: g.id }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await kidsService.create({
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        gender: String(fd.get('gender')) as 'Male' | 'Female',
        dateOfBirth: String(fd.get('dateOfBirth')),
        motherId: String(fd.get('motherId')),
        fatherId: String(fd.get('fatherId') || '') || null,
        weight: Number(fd.get('weight')),
        healthStatus: String(fd.get('healthStatus')),
        vaccinationStatus: String(fd.get('vaccinationStatus')),
        status: String(fd.get('status')),
        imageUrl,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Kid registered for ${currentUser.name}`);
      router.push('/kids');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save kid', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Register Kid" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload folder="kids" value={imageUrl} onChange={setImageUrl} />
          </div>
          <Input name="tagNumber" label="Tag Number" required />
          <Select
            name="gender"
            label="Gender"
            required
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
          />
          <Input name="dateOfBirth" label="Date of Birth" type="date" required />
          <Select name="motherId" label="Mother" required options={females} placeholder="Select mother" />
          <Select name="fatherId" label="Father" options={males} placeholder="Select father (optional)" />
          <Input name="weight" label="Weight (kg)" type="number" step="0.1" required />
          <Select
            name="healthStatus"
            label="Health"
            required
            options={(['Healthy', 'Sick', 'Under Treatment', 'Recovering'] as HealthStatus[]).map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            options={(['Up to Date', 'Due', 'Overdue', 'Not Vaccinated'] as VaccinationStatus[]).map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <Select
            name="status"
            label="Status"
            required
            options={(['Active', 'Sold', 'Deceased'] as GoatStatus[]).map((v) => ({ label: v, value: v }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/kids">
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
