'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  expensesService,
  financeUsersService,
  goatPurchasesService,
  salesService,
  type FinanceUserOption,
} from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button, LoadingState } from '@/components/ui';
import type { ExpenseCategory, PaymentMethod } from '@/types/farm';

type EntryType = 'sale' | 'purchase' | 'expense';

function NewCashbookEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const initialType = (searchParams.get('type') as EntryType | null) ?? 'sale';
  const [type, setType] = useState<EntryType>(
    ['sale', 'purchase', 'expense'].includes(initialType) ? initialType : 'sale'
  );
  const [cashHandlerId, setCashHandlerId] = useState(currentUser.id);
  const [partners, setPartners] = useState<FinanceUserOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const options = await financeUsersService.getOptions();
        if (options.length) {
          setPartners(options);
          setCashHandlerId((prev) =>
            options.some((o) => o.id === prev) ? prev : options[0].id
          );
        }
      } catch {
        /* keep empty */
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const moneyLabel =
    type === 'sale' ? 'Cash received by' : 'Cash paid / sent by';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const selectedHandler = String(fd.get('cashHandlerId') || cashHandlerId);
    setSaving(true);
    try {
      if (type === 'sale') {
        await salesService.create({
          date: String(fd.get('date')),
          tagNumber: String(fd.get('tagNumber') ?? '').trim(),
          buyer: String(fd.get('buyer') ?? '').trim(),
          salePrice: Number(fd.get('salePrice')),
          paymentStatus: String(fd.get('paymentStatus')),
          paymentMethod: String(fd.get('paymentMethod')),
          notes: String(fd.get('notes') ?? '') || null,
          cashHandlerId: selectedHandler,
        });
        toast('Sale recorded');
      } else if (type === 'purchase') {
        await goatPurchasesService.create({
          date: String(fd.get('date')),
          tagNumber: String(fd.get('tagNumber') ?? '').trim(),
          seller: String(fd.get('seller') ?? '').trim(),
          purchasePrice: Number(fd.get('purchasePrice')),
          paymentStatus: String(fd.get('paymentStatus')),
          notes: String(fd.get('notes') ?? '') || null,
          cashHandlerId: selectedHandler,
        });
        toast('Purchase recorded');
      } else {
        await expensesService.create({
          date: String(fd.get('date')),
          category: String(fd.get('category')),
          description: String(fd.get('description') ?? '').trim(),
          amount: Number(fd.get('amount')),
          paymentMethod: String(fd.get('paymentMethod')),
          notes: String(fd.get('notes') ?? '') || null,
          cashHandlerId: selectedHandler,
        });
        toast('Expense recorded');
      }
      router.push('/cashbook');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save entry', 'error');
      setSaving(false);
    }
  };

  if (loadingUsers) {
    return <LoadingState label="Loading users…" />;
  }

  return (
    <div>
      <PageHeader
        title="New Cashbook Entry"
        description="Choose who handled the cash. Record added by is always you."
      />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Entry type"
            required
            disabled={saving}
            options={[
              { label: 'Sale (money in)', value: 'sale' },
              { label: 'Animal purchase (money out)', value: 'purchase' },
              { label: 'Expense (money out)', value: 'expense' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as EntryType)}
          />
          <Select
            name="cashHandlerId"
            label={moneyLabel}
            required
            disabled={saving}
            options={
              partners.length
                ? partners.map((p) => ({ label: p.name, value: p.id }))
                : [{ label: currentUser.name, value: currentUser.id }]
            }
            value={cashHandlerId}
            onChange={(e) => setCashHandlerId(e.target.value)}
          />
          <Input
            label="Record added by"
            value={currentUser.name}
            disabled
            hint="Automatically set to the logged-in user"
          />

          <Input
            name="date"
            label="Date"
            type="date"
            required
            disabled={saving}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />

          {type === 'sale' && (
            <>
              <Input
                name="tagNumber"
                label="Tag Number"
                required
                placeholder="e.g. G001"
                disabled={saving}
              />
              <Input
                name="buyer"
                label="Buyer"
                required
                className="sm:col-span-2"
                disabled={saving}
              />
              <Input
                name="salePrice"
                label="Sale Price (Rs.)"
                type="number"
                required
                disabled={saving}
              />
              <Select
                name="paymentStatus"
                label="Payment Status"
                required
                disabled={saving}
                options={['Paid', 'Unpaid', 'Partial'].map((s) => ({ label: s, value: s }))}
              />
              <Select
                name="paymentMethod"
                label="Payment Method"
                required
                disabled={saving}
                options={(
                  ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
                ).map((m) => ({ label: m, value: m }))}
              />
            </>
          )}

          {type === 'purchase' && (
            <>
              <Input
                name="tagNumber"
                label="Tag Number"
                required
                placeholder="e.g. G001"
                disabled={saving}
              />
              <Input
                name="seller"
                label="Seller"
                required
                className="sm:col-span-2"
                disabled={saving}
              />
              <Input
                name="purchasePrice"
                label="Purchase Price (Rs.)"
                type="number"
                required
                disabled={saving}
              />
              <Select
                name="paymentStatus"
                label="Payment Status"
                required
                disabled={saving}
                options={['Paid', 'Unpaid', 'Partial'].map((s) => ({ label: s, value: s }))}
              />
            </>
          )}

          {type === 'expense' && (
            <>
              <Select
                name="category"
                label="Category"
                required
                disabled={saving}
                options={(
                  [
                    'Feed',
                    'Medicine',
                    'Veterinary',
                    'Worker Salary',
                    'Transport',
                    'Equipment',
                    'Maintenance',
                    'Utilities',
                    'Other',
                  ] as ExpenseCategory[]
                ).map((c) => ({ label: c, value: c }))}
              />
              <Input
                name="description"
                label="Description"
                required
                className="sm:col-span-2"
                disabled={saving}
              />
              <Input
                name="amount"
                label="Amount (Rs.)"
                type="number"
                required
                disabled={saving}
              />
              <Select
                name="paymentMethod"
                label="Payment Method"
                required
                disabled={saving}
                options={(
                  ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
                ).map((m) => ({ label: m, value: m }))}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/cashbook">
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

export default function NewCashbookEntryPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <NewCashbookEntryForm />
    </Suspense>
  );
}
