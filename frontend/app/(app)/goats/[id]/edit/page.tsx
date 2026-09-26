'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { goatsService } from '@/services/goats';
import {
  financeUsersService,
  type FinanceUserOption,
} from '@/services/finance';
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
  Modal,
  LoadingState,
} from '@/components/ui';
import type { Goat, VaccinationStatus } from '@/types/farm';
import { GOAT_STATUS_OPTIONS, normalizeGoatStatus } from '@/lib/goatStatus';
import type { PaymentMethod } from '@/types/farm';
import { ageMonthsFromDob, dobFromAgeMonths } from '@/lib/format';

type PendingPayload = {
  tagNumber: string;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  weight: number;
  color: string;
  currentValue: number;
  vaccinationStatus: string;
  status: string;
  imageUrl: string | null;
  notes: string | null;
};

export default function EditGoatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canModifyRecord, currentUser } = useAuth();
  const { toast } = useToast();
  const [goat, setGoat] = useState<Goat | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [saleOpen, setSaleOpen] = useState(false);
  const [pending, setPending] = useState<PendingPayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<FinanceUserOption[]>([]);
  const [saleCashHandlerId, setSaleCashHandlerId] = useState(currentUser.id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void goatsService.getById(id).then((g) => {
      if (cancelled) return;
      if (!g) {
        setGoat(null);
        setLoading(false);
        return;
      }
      const normalized = { ...g, status: normalizeGoatStatus(g.status) as Goat['status'] };
      setGoat(normalized);
      setImageUrl(g.imageUrl ?? null);
      setStatus(normalizeGoatStatus(g.status));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    void financeUsersService
      .getOptions()
      .then((options) => {
        if (!options.length) return;
        setPartners(options);
        setSaleCashHandlerId((prev) =>
          options.some((o) => o.id === prev) ? prev : options[0].id
        );
      })
      .catch(() => {
        /* keep empty — sale form still works with current user if listed */
      });
  }, []);

  if (loading) {
    return <LoadingState label="Loading animal…" />;
  }

  if (!goat) {
    return <p className="text-sm text-muted-fg">Goat not found.</p>;
  }

  const canEdit = canModifyRecord(goat.ownerId);
  const previousStatus = normalizeGoatStatus(goat.status);

  const save = async (
    payload: PendingPayload,
    sale?: {
      salePrice: number;
      saleBuyer: string;
      salePaymentMethod: string;
      salePaymentStatus: string;
      saleDate: string;
      saleCashHandlerId: string;
    }
  ) => {
    setSaving(true);
    try {
      await goatsService.update(goat.id, {
        ...payload,
        ...sale,
      });
      const leavingSold = previousStatus === 'Sold' && payload.status !== 'Sold';
      toast(
        leavingSold
          ? 'Status updated — linked sale reverted from cashbook'
          : sale
            ? 'Marked as Sold — sale added to cashbook'
            : 'Goat updated'
      );
      router.push(`/goats/${goat.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
      setSaleOpen(false);
      setPending(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    const fd = new FormData(e.currentTarget);
    const nextStatus = String(fd.get('status') || status);
    const ageMonths = Number(fd.get('ageMonths'));
    if (!(ageMonths >= 0) || Number.isNaN(ageMonths)) {
      toast('Enter a valid age in months', 'error');
      return;
    }
    const payload: PendingPayload = {
      tagNumber: String(fd.get('tagNumber') ?? '').trim(),
      breed: String(fd.get('breed') ?? '').trim(),
      gender: String(fd.get('gender')) as 'Male' | 'Female',
      dateOfBirth: dobFromAgeMonths(ageMonths),
      weight: Number(fd.get('weight')),
      color: String(fd.get('color') ?? '').trim(),
      currentValue: Number(fd.get('currentValue')),
      vaccinationStatus: String(fd.get('vaccinationStatus')),
      status: nextStatus,
      imageUrl,
      notes: String(fd.get('notes') ?? '') || null,
    };

    if (nextStatus === 'Sold' && previousStatus !== 'Sold') {
      setPending(payload);
      setSaleOpen(true);
      return;
    }

    await save(payload);
  };

  const confirmSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pending) return;
    const fd = new FormData(e.currentTarget);
    const salePrice = Number(fd.get('salePrice'));
    if (!(salePrice > 0)) {
      toast('Enter a valid sale amount', 'error');
      return;
    }
    await save(pending, {
      salePrice,
      saleBuyer: String(fd.get('saleBuyer') ?? '').trim() || 'Walk-in buyer',
      salePaymentMethod: String(fd.get('salePaymentMethod') || 'Cash'),
      salePaymentStatus: String(fd.get('salePaymentStatus') || 'Paid'),
      saleDate: String(fd.get('saleDate') || new Date().toISOString().slice(0, 10)),
      saleCashHandlerId: String(fd.get('saleCashHandlerId') || saleCashHandlerId),
    });
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
          <Input
            name="tagNumber"
            label="Tag Number"
            defaultValue={goat.tagNumber}
            required
            disabled={!canEdit}
          />
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
            name="ageMonths"
            label="Age (months)"
            type="number"
            step="0.1"
            min={0}
            defaultValue={ageMonthsFromDob(goat.dateOfBirth)}
            required
            disabled={!canEdit}
            placeholder="e.g. 12.5"
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
            label="Animal Status"
            required
            disabled={!canEdit}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={GOAT_STATUS_OPTIONS}
          />
          {previousStatus === 'Sold' && status !== 'Sold' && (
            <p className="sm:col-span-2 text-sm text-amber-800">
              Changing away from Sold will remove the linked sale from the cashbook.
            </p>
          )}
          {status === 'Pregnant' && goat.gender === 'Female' && (
            <p className="sm:col-span-2 text-sm text-emerald-800">
              When she gives birth, use{' '}
              <Link href={`/kids/new?motherId=${goat.id}`} className="underline">
                Record Birth
              </Link>{' '}
              — the kid is added to Kids and Animals, and mother returns to Healthy.
            </p>
          )}
          <div className="sm:col-span-2">
            <Textarea
              name="notes"
              label="Notes"
              rows={3}
              defaultValue={goat.notes ?? ''}
              disabled={!canEdit}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href={`/goats/${goat.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            {canEdit && (
              <Button type="submit" loading={saving}>
                Save
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Modal
        open={saleOpen}
        onClose={() => {
          if (!saving) {
            setSaleOpen(false);
            setPending(null);
          }
        }}
        title="Record sale amount"
        footer={null}
      >
        <p className="mb-4 text-sm text-muted-fg">
          Marking this animal as Sold will add a sale entry to the cashbook. Enter the sale details
          below.
        </p>
        <form onSubmit={(e) => void confirmSale(e)} className="grid gap-4">
          <Input
            name="salePrice"
            label="Sale Amount (Rs.)"
            type="number"
            required
            defaultValue={goat.currentValue}
            min={1}
          />
          <Input name="saleBuyer" label="Buyer" placeholder="Walk-in buyer" />
          <Input
            name="saleDate"
            label="Sale Date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <Select
            name="salePaymentStatus"
            label="Payment Status"
            required
            defaultValue="Paid"
            options={['Paid', 'Unpaid', 'Partial'].map((s) => ({ label: s, value: s }))}
          />
          <Select
            name="salePaymentMethod"
            label="Payment Method"
            required
            defaultValue="Cash"
            options={(
              ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
            ).map((m) => ({ label: m, value: m }))}
          />
          <Select
            name="saleCashHandlerId"
            label="Amount received by"
            required
            options={
              partners.length
                ? partners.map((p) => ({ label: p.name, value: p.id }))
                : [{ label: currentUser.name, value: currentUser.id }]
            }
            value={saleCashHandlerId}
            onChange={(e) => setSaleCashHandlerId(e.target.value)}
          />
          <Input label="Record added by" value={currentUser.name} disabled />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setSaleOpen(false);
                setPending(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Confirm sale
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
