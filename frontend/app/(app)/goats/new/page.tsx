'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { goatsService } from '@/services/goats';
import {
  financeUsersService,
  type FinanceUserOption,
} from '@/services/finance';
import { PageHeader, Card, Input, Select, Textarea, Button, ImageUpload, LoadingState } from '@/components/ui';
import type { VaccinationStatus } from '@/types/farm';
import { GOAT_STATUS_OPTIONS } from '@/lib/goatStatus';
import { dobFromAgeMonths } from '@/lib/format';

export default function NewGoatPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [partners, setPartners] = useState<FinanceUserOption[]>([]);
  const [paidById, setPaidById] = useState(currentUser.id);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void financeUsersService
      .getOptions()
      .then((options) => {
        if (!options.length) return;
        setPartners(options);
        setPaidById((prev) => (options.some((o) => o.id === prev) ? prev : options[0].id));
      })
      .catch(() => {
        /* keep current user fallback */
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const ageMonths = Number(fd.get('ageMonths'));
    if (!(ageMonths >= 0) || Number.isNaN(ageMonths)) {
      toast('Enter a valid age in months', 'error');
      return;
    }
    const dateOfBirth = dobFromAgeMonths(ageMonths);
    const purchaseDate = String(fd.get('purchaseDate') || today);
    const currentValue = Number(fd.get('currentValue'));
    const purchaseCashHandlerId = String(fd.get('purchaseCashHandlerId') || paidById);

    if (purchaseDate < dateOfBirth) {
      toast('Purchase date cannot be before the animal’s birth (from age)', 'error');
      return;
    }

    if (currentValue > 0 && !purchaseCashHandlerId) {
      toast('Select who paid the purchase amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await goatsService.create({
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        breed: String(fd.get('breed') ?? '').trim(),
        gender: String(fd.get('gender')) as 'Male' | 'Female',
        dateOfBirth,
        purchaseDate,
        purchasePrice: currentValue > 0 ? currentValue : null,
        weight: Number(fd.get('weight')),
        color: String(fd.get('color') ?? '').trim(),
        currentValue,
        vaccinationStatus: String(fd.get('vaccinationStatus')),
        status: String(fd.get('status') || 'Healthy'),
        imageUrl,
        notes: String(fd.get('notes') ?? '') || null,
        purchaseCashHandlerId: currentValue > 0 ? purchaseCashHandlerId : null,
      });
      toast(
        currentValue > 0
          ? `Animal saved — Rs. ${currentValue} purchase added to cashbook`
          : `Animal saved for ${currentUser.name}`
      );
      router.push('/goats');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save goat', 'error');
      setSaving(false);
    }
  };

  if (loadingUsers) {
    return <LoadingState label="Loading users…" />;
  }

  const userOptions = partners.length
    ? partners.map((p) => ({ label: p.name, value: p.id }))
    : [{ label: currentUser.name, value: currentUser.id }];

  return (
    <div>
      <PageHeader
        title="Add Animal"
        description={`New record will be added by ${currentUser.name}.`}
      />

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageUpload folder="goats" value={imageUrl} onChange={setImageUrl} disabled={saving} />
          </div>
          <Input name="tagNumber" label="Tag Number" required disabled={saving} />
          <Input name="breed" label="Breed" required disabled={saving} />
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
          <Input name="color" label="Color" required disabled={saving} />
          <Input
            name="ageMonths"
            label="Age (months)"
            type="number"
            step="0.1"
            min={0}
            required
            disabled={saving}
            placeholder="e.g. 12.5"
          />
          <Input
            name="purchaseDate"
            label="Purchase Date"
            type="date"
            required
            disabled={saving}
            defaultValue={today}
            max={today}
          />
          <Input
            name="weight"
            label="Weight (kg)"
            type="number"
            step="0.1"
            required
            disabled={saving}
          />
          <Input
            name="currentValue"
            label="Purchase Price (Rs.)"
            type="number"
            required
            disabled={saving}
            min={0}
            hint="Saved as animal value and added to cashbook as a purchase"
          />
          <Select
            name="purchaseCashHandlerId"
            label="Amount paid by"
            required
            disabled={saving}
            options={userOptions}
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
          />
          <Input label="Record added by" value={currentUser.name} disabled />
          <Select
            name="vaccinationStatus"
            label="Vaccination"
            required
            disabled={saving}
            options={(
              ['Up to Date', 'Due', 'Overdue', 'Not Vaccinated'] as VaccinationStatus[]
            ).map((v) => ({ label: v, value: v }))}
          />
          <Select
            name="status"
            label="Animal Status"
            required
            disabled={saving}
            defaultValue="Healthy"
            options={GOAT_STATUS_OPTIONS}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/goats">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
