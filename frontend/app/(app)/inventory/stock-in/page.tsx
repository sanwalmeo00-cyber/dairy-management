'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { inventoryService } from '@/services/inventory';
import { walletService } from '@/services/finance';
import { useToast } from '@/context/ToastContext';
import {
  PageHeader,
  Card,
  Select,
  Input,
  Textarea,
  Button,
  LoadingState,
} from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { isExpirableCategory } from '@/lib/inventoryExpiry';
import type { InventoryItem } from '@/types/farm';

function StockInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const preselect = searchParams.get('item') ?? '';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemId, setItemId] = useState(preselect);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([inventoryService.getAll(), walletService.getBalance().catch(() => null)])
      .then(([list, balance]) => {
        setItems(list);
        if (balance != null) setWalletBalance(balance);
        if (preselect && list.some((i) => i.id === preselect)) setItemId(preselect);
        else if (list.length && !preselect) setItemId(list[0].id);
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load items', 'error'))
      .finally(() => setLoading(false));
  }, [toast, preselect]);

  const options = useMemo(
    () => items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id })),
    [items]
  );
  const selected = items.find((i) => i.id === itemId);
  const needsExpiry = selected ? isExpirableCategory(selected.category) : false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const selectedId = String(fd.get('itemId') || itemId);
    const quantity = Number(fd.get('quantity'));
    const cost = Number(fd.get('cost'));
    const expiryDate = String(fd.get('expiryDate') ?? '').trim() || null;
    if (!(cost > 0)) {
      toast('Enter the total purchase price', 'error');
      return;
    }
    if (needsExpiry && !expiryDate) {
      toast('Expiration date is required for medicine and vaccines', 'error');
      return;
    }
    if (walletBalance != null && walletBalance < cost) {
      toast(
        `Not enough money in wallet. Wallet has ${formatCurrency(walletBalance)}, need ${formatCurrency(cost)}.`,
        'error'
      );
      return;
    }
    setSaving(true);
    try {
      await inventoryService.stockIn(selectedId, {
        date: String(fd.get('date')),
        quantity,
        cost,
        expiryDate,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Stock in saved — ${formatCurrency(cost)} posted to cashbook`);
      router.push(`/inventory/${selectedId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record stock in', 'error');
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading items…" />;

  if (walletBalance != null && walletBalance <= 0) {
    return (
      <div>
        <PageHeader
          title="Stock In"
          description="Stock purchases are taken from the farm wallet."
        />
        <Card>
          <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            Wallet is empty. Add Money in on the cashbook before stocking in.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/inventory">
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
        title="Stock In"
        description={
          walletBalance != null
            ? `Add quantity and total purchase price. Taken from wallet (${formatCurrency(walletBalance)}).`
            : 'Add quantity and total purchase price — posts to the cashbook.'
        }
      />
      <Card>
        {!options.length ? (
          <p className="text-sm text-muted-fg">
            No items yet.{' '}
            <Link href="/inventory/new" className="text-primary underline">
              Add an item
            </Link>{' '}
            first.
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
            <Select
              name="itemId"
              label="Item"
              required
              options={options}
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={saving}
            />
            <Input
              name="date"
              label="Date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={saving}
            />
            <Input
              name="quantity"
              label="Quantity"
              type="number"
              min={0.01}
              step="0.01"
              required
              disabled={saving}
            />
            <Input
              name="cost"
              label="Total purchase price (Rs.)"
              type="number"
              min={1}
              step="0.01"
              required
              disabled={saving}
              hint="Full amount paid for this delivery — not unit price"
            />
            {needsExpiry && (
              <Input
                key={`expiry-${itemId}`}
                name="expiryDate"
                label="Expiration date"
                type="date"
                required
                disabled={saving}
                defaultValue={selected?.expiryDate}
                className="sm:col-span-2"
                hint="After this date, remaining stock is removed from in-stock automatically"
              />
            )}
            <div className="sm:col-span-2">
              <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Link href="/inventory">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={saving} disabled={!options.length}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function StockInPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <StockInForm />
    </Suspense>
  );
}
