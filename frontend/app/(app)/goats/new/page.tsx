'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { goatsService } from '@/services/goats';
import { walletService } from '@/services/finance';
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
import type { VaccinationStatus } from '@/types/farm';
import { GOAT_STATUS_OPTIONS } from '@/lib/goatStatus';
import { dobFromAgeMonths, formatCurrency } from '@/lib/format';

export default function NewGoatPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void walletService
      .getBalance()
      .then(setWalletBalance)
      .catch(() => setWalletBalance(null))
      .finally(() => setWalletReady(true));
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

    if (purchaseDate < dateOfBirth) {
      toast('Purchase date cannot be before the animal’s birth (from age)', 'error');
      return;
    }

    if (currentValue > 0 && walletBalance != null && walletBalance < currentValue) {
      toast(
        `Not enough money in wallet for buying this animal. Wallet has ${formatCurrency(walletBalance)}, but ${formatCurrency(currentValue)} is needed. Add Money in first.`,
        'error'
      );
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
      });
      toast(
        currentValue > 0
          ? `Animal saved — Rs. ${currentValue} taken from wallet`
          : `Animal saved for ${currentUser.name}`
      );
      router.push('/goats');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save goat', 'error');
      setSaving(false);
    }
  };

  if (!walletReady) {
    return <LoadingState label="Checking wallet…" />;
  }

  if (walletBalance != null && walletBalance <= 0) {
    return (
      <div>
        <PageHeader
          title="Add Animal"
          description="Purchase price is taken from the farm wallet."
        />
        <Card>
          <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            Wallet is empty. Add Money in on the cashbook before buying an animal with a purchase
            price.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/goats">
              <Button type="button" variant="outline">
                Back
              </Button>
            </Link>
            <Link href="/cashbook/new?type=sale">
              <Button type="button">Go to Cashbook</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add Animal"
        description={
          walletBalance != null
            ? `Added by ${currentUser.name}. Wallet: ${formatCurrency(walletBalance)} — purchase price is taken from the wallet.`
            : `New record will be added by ${currentUser.name}.`
        }
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
            hint="Saved as animal value and taken from the farm wallet"
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
