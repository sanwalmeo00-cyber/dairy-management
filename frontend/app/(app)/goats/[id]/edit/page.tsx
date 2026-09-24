'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  PageHeader,
  Card,
  Input,
  Select,
  Textarea,
  Button,
  ViewOnlyBanner,
  ImageUpload,
} from '@/components/ui';
import type { Goat, HealthStatus, VaccinationStatus, GoatStatus } from '@/types/farm';

export default function EditGoatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canModifyRecord } = useAuth();
  const { toast } = useToast();
  const [goat, setGoat] = useState<Goat | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void goatsService.getById(id).then((g) => {
      setGoat(g ?? null);
      setImageUrl(g?.imageUrl ?? null);
    });
  }, [id]);

  if (!goat) {
    return <p className="text-sm text-muted-fg">Goat not found.</p>;
  }

  const canEdit = canModifyRecord(goat.ownerId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    const fd = new FormData(e.currentTarget);
    try {
      await goatsService.update(goat.id, {
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
      toast('Goat updated');
      router.push(`/goats/${goat.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <div>
      <PageHeader title={`Edit ${goat.tagNumber}`} description={goat.breed} />
      {!canEdit && <ViewOnlyBanner ownerName={goat.ownerName} />}

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload
              folder="goats"
              value={imageUrl}
              onChange={setImageUrl}
              disabled={!canEdit}
            />
          </div>
          <Input name="tagNumber" label="Tag Number" defaultValue={goat.tagNumber} required disabled={!canEdit} />
          <Input name="breed" label="Breed" defaultValue={goat.breed} required disabled={!canEdit} />
          <Select
            name="gender"
            label="Gender"
            required
            disabled={!canEdit}
            defaultValue={goat.gender}
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
          />
          <Input
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            defaultValue={goat.dateOfBirth.slice(0, 10)}
            required
            disabled={!canEdit}
          />
          <Input
            name="weight"
            label="Weight (kg)"
            type="number"
            step="0.1"
            defaultValue={goat.weight}
            required
            disabled={!canEdit}
          />
          <Input name="color" label="Color" defaultValue={goat.color} required disabled={!canEdit} />
          <Input
            name="currentValue"
            label="Current Value (Rs.)"
            type="number"
            defaultValue={goat.currentValue}
            required
            disabled={!canEdit}
          />
          <Select
            name="healthStatus"
            label="Health Status"
            required
            disabled={!canEdit}
            defaultValue={goat.healthStatus}
            options={(
              ['Healthy', 'Sick', 'Under Treatment', 'Recovering'] as HealthStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            disabled={!canEdit}
            defaultValue={goat.vaccinationStatus}
            options={(
              ['Up to Date', 'Due', 'Overdue', 'Not Vaccinated'] as VaccinationStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <Select
            name="status"
            label="Status"
            required
            disabled={!canEdit}
            defaultValue={goat.status}
            options={(['Active', 'Sold', 'Deceased'] as GoatStatus[]).map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} defaultValue={goat.notes ?? ''} disabled={!canEdit} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href={`/goats/${goat.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            {canEdit && <Button type="submit">Save</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
