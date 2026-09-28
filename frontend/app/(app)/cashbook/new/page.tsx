'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  expensesService,
  financeUsersService,
  goatPurchasesService,
  salesService,
  walletService,
  type FinanceUserOption,
} from '@/services/finance';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button, LoadingState } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { ExpenseCategory } from '@/types/farm';

type EntryType = 'sale' | 'cashout' | 'purchase' | 'expense';

function NewCashbookEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialType = (searchParams.get('type') as EntryType | null) ?? 'sale';
  const [type, setType] = useState<EntryType>(
    ['sale', 'cashout', 'purchase', 'expense'].includes(initialType) ? initialType : 'sale'
  );
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [partners, setPartners] = useState<FinanceUserOption[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [moneyFromId, setMoneyFromId] = useState('');
  const [givenToId, setGivenToId] = useState('');

  useEffect(() => {
    void Promise.all([financeUsersService.getOptions(), walletService.getBalance()])
      .then(([options, balance]) => {
        setPartners(options);
        setWalletBalance(balance);
        if (options.length) {
          setMoneyFromId(options[0].id);
          setGivenToId(options[0].id);
        }
      })
      .catch(() => {
        toast('Failed to load form data', 'error');
      })
      .finally(() => setLoadingUsers(false));
  }, [toast]);

  const partnerOptions = partners.map((p) => ({ label: p.name, value: p.id }));
  const isMoneyOut = type === 'cashout' || type === 'purchase' || type === 'expense';

  const ensureWalletHas = (amount: number, label: string) => {
    if (!(amount > 0)) {
      toast('Enter a valid amount', 'error');
      return false;
    }
    if (walletBalance < amount) {
      toast(
        `Not enough money in wallet for ${label}. Wallet has ${formatCurrency(walletBalance)}, but ${formatCurrency(amount)} is needed. Add Money in first.`,
        'error'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      if (type === 'sale') {
        const fromId = String(fd.get('buyerId') || moneyFromId);
        const fromUser = partners.find((p) => p.id === fromId);
        if (!fromUser) {
          toast('Select who the money is from', 'error');
          setSaving(false);
          return;
        }
        await salesService.create({
          date: String(fd.get('date')),
          buyer: fromUser.name,
          salePrice: Number(fd.get('salePrice')),
          paymentStatus: 'Paid',
          notes: String(fd.get('notes') ?? '') || null,
        });
        toast('Money in recorded — added to wallet');
      } else if (type === 'cashout') {
        const toId = String(fd.get('partnerId') || givenToId);
        const toUser = partners.find((p) => p.id === toId);
        if (!toUser) {
          toast('Select who receives the cash', 'error');
          setSaving(false);
          return;
        }
        const amount = Number(fd.get('amount'));
        if (!ensureWalletHas(amount, 'cash out to partner')) {
          setSaving(false);
          return;
        }
        await expensesService.create({
          date: String(fd.get('date')),
          category: 'Partner Payout',
          description: `Cash out · ${toUser.name}`,
          amount,
          notes: String(fd.get('notes') ?? '') || null,
        });
        toast(`Cash out recorded — Rs. ${amount.toLocaleString()} taken from wallet`);
      } else if (type === 'purchase') {
        const purchasePrice = Number(fd.get('purchasePrice'));
        if (!ensureWalletHas(purchasePrice, 'this animal purchase')) {
          setSaving(false);
          return;
        }
        await goatPurchasesService.create({
          date: String(fd.get('date')),
          tagNumber: String(fd.get('tagNumber') ?? '').trim(),
          purchasePrice,
          paymentStatus: 'Paid',
          notes: String(fd.get('notes') ?? '') || null,
        });
        toast('Purchase recorded — taken from wallet');
      } else {
        const note = String(fd.get('notes') ?? '').trim();
        const category = String(fd.get('category'));
        const amount = Number(fd.get('amount'));
        if (!ensureWalletHas(amount, 'this expense')) {
          setSaving(false);
          return;
        }
        await expensesService.create({
          date: String(fd.get('date')),
          category,
          description: note || category,
          amount,
        });
        toast('Expense recorded — taken from wallet');
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
        description={`Wallet balance: ${formatCurrency(walletBalance)}. Money in adds to the wallet; cash out, purchases, and expenses require enough balance.`}
      />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          {isMoneyOut && walletBalance <= 0 && (
            <p className="sm:col-span-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              Wallet is empty. Add Money in before cash out, purchase, or expense.
            </p>
          )}
          <Select
            label="Entry type"
            required
            disabled={saving}
            options={[
              { label: 'Money in (partner invests)', value: 'sale' },
              { label: 'Cash out (given to partner)', value: 'cashout' },
              { label: 'Animal purchase (money out)', value: 'purchase' },
              { label: 'Expense (money out)', value: 'expense' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as EntryType)}
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
              <Select
                name="buyerId"
                label="Money from"
                required
                disabled={saving || !partnerOptions.length}
                options={partnerOptions}
                value={moneyFromId}
                onChange={(e) => setMoneyFromId(e.target.value)}
                className="sm:col-span-2"
              />
              {!partnerOptions.length && (
                <p className="sm:col-span-2 text-sm text-danger">
                  No farm users found. Create a user (not Super Admin) first.
                </p>
              )}
              <Input
                name="salePrice"
                label="Amount (Rs.)"
                type="number"
                required
                disabled={saving}
                className="sm:col-span-2"
              />
            </>
          )}

          {type === 'cashout' && (
            <>
              <Select
                name="partnerId"
                label="Given to"
                required
                disabled={saving || !partnerOptions.length}
                options={partnerOptions}
                value={givenToId}
                onChange={(e) => setGivenToId(e.target.value)}
                className="sm:col-span-2"
              />
              <Input
                name="amount"
                label="Amount (Rs.)"
                type="number"
                required
                min={1}
                disabled={saving}
                className="sm:col-span-2"
              />
              <p className="sm:col-span-2 text-sm text-muted-fg">
                Example: partner invested 100k; after animal sale you return 50k — record that 50k
                here as cash out. The rest stays in the wallet.
              </p>
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
                name="purchasePrice"
                label="Purchase Price (Rs.)"
                type="number"
                required
                disabled={saving}
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
                name="amount"
                label="Amount (Rs.)"
                type="number"
                required
                disabled={saving}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <Textarea
              name="notes"
              label="Notes"
              rows={3}
              disabled={saving}
              required={type === 'expense'}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/cashbook">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} disabled={!partnerOptions.length && (type === 'sale' || type === 'cashout')}>
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
