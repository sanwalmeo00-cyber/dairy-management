'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { goatsService } from '@/services/goats';
import { PageHeader, Card, Input, Select, Textarea, Button, ImageUpload } from '@/components/ui';
import type { GoatStatus, HealthStatus, VaccinationStatus } from '@/types/farm';

export default function NewGoatPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await goatsService.create({
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        breed: String(fd.get('breed') ?? '').trim(),
        gender: String(fd.get('gender')) as 'Male' | 'Female',
        dateOfBirth: String(fd.get('dateOfBirth')),
        weight: Number(fd.get('weight')),
        color: String(fd.get('color') ?? '').trim(),
        currentValue: Number(fd.get('currentValue')),
        healthStatus: String(fd.get('healthStatus')),
        vaccinationStatus: String(fd.get('vaccinationStatus')),
        status: String(fd.get('status')),
        imageUrl,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Goat saved for ${currentUser.name}`);
      router.push('/goats');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save goat', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Add Animal" description={`New record will be owned by ${currentUser.name}.`} />

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload folder="goats" value={imageUrl} onChange={setImageUrl} />
          </div>
          <Input name="tagNumber" label="Tag Number" required />
          <Input name="breed" label="Breed" required />
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
          <Input name="weight" label="Weight (kg)" type="number" step="0.1" required />
          <Input name="color" label="Color" required />
          <Input name="currentValue" label="Current Value (Rs.)" type="number" required />
          <Select
            name="healthStatus"
            label="Health Status"
            required
            options={(
              ['Healthy', 'Sick', 'Under Treatment', 'Recovering'] as HealthStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            options={(
              ['Up to Date', 'Due', 'Overdue', 'Not Vaccinated'] as VaccinationStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <Select
            name="status"
            label="Status"
            required
            options={(['Active', 'Sold', 'Deceased'] as GoatStatus[]).map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/goats">
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
