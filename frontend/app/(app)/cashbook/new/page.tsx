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
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
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
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [partners, setPartners] = useState<FinanceUserOption[]>([
    { id: currentUser.id, name: currentUser.name },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const options = await financeUsersService.getOptions();
        if (options.length) {
          setPartners(options);
          if (!options.some((o) => o.id === ownerId)) {
            setOwnerId(options[0].id);
          }
        }
      } catch {
        /* keep current user only */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moneyLabel =
    type === 'sale' ? 'Received by (user)' : 'Paid by (user)';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const selectedOwner = String(fd.get('ownerId') || ownerId);
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
          ownerId: selectedOwner,
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
          ownerId: selectedOwner,
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
          ownerId: selectedOwner,
        });
        toast('Expense recorded');
      }
      router.push('/cashbook');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="New Cashbook Entry"
        description="Record a sale, purchase, or expense and choose who paid or received the money."
      />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Entry type"
            required
            options={[
              { label: 'Sale (money in)', value: 'sale' },
              { label: 'Animal purchase (money out)', value: 'purchase' },
              { label: 'Expense (money out)', value: 'expense' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as EntryType)}
          />
          <Select
            name="ownerId"
            label={moneyLabel}
            required
            options={partners.map((p) => ({ label: p.name, value: p.id }))}
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />

          <Input name="date" label="Date" type="date" required />

          {type === 'sale' && (
            <>
              <Input name="tagNumber" label="Tag Number" required placeholder="e.g. G001" />
              <Input name="buyer" label="Buyer" required className="sm:col-span-2" />
              <Input name="salePrice" label="Sale Price (Rs.)" type="number" required />
              <Select
                name="paymentStatus"
                label="Payment Status"
                required
                options={['Paid', 'Unpaid', 'Partial'].map((s) => ({ label: s, value: s }))}
              />
              <Select
                name="paymentMethod"
                label="Payment Method"
                required
                options={(
                  ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
                ).map((m) => ({ label: m, value: m }))}
              />
            </>
          )}

          {type === 'purchase' && (
            <>
              <Input name="tagNumber" label="Tag Number" required placeholder="e.g. G001" />
              <Input name="seller" label="Seller" required className="sm:col-span-2" />
              <Input name="purchasePrice" label="Purchase Price (Rs.)" type="number" required />
              <Select
                name="paymentStatus"
                label="Payment Status"
                required
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
              <Input name="description" label="Description" required className="sm:col-span-2" />
              <Input name="amount" label="Amount (Rs.)" type="number" required />
              <Select
                name="paymentMethod"
                label="Payment Method"
                required
                options={(
                  ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
                ).map((m) => ({ label: m, value: m }))}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/cashbook">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewCashbookEntryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-fg">Loading…</p>}>
      <NewCashbookEntryForm />
    </Suspense>
  );
}
