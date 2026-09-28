'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { inventoryService } from '@/services/inventory';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Select, Input, Textarea, Button, LoadingState } from '@/components/ui';

function StockOutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const preselect = searchParams.get('item') ?? '';
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [itemId, setItemId] = useState(preselect);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void inventoryService
      .getAll()
      .then((items) => {
        setOptions(
          items.map((i) => ({
            label: `${i.name} (${i.currentStock} ${i.unit})`,
            value: i.id,
          }))
        );
        if (preselect && items.some((i) => i.id === preselect)) setItemId(preselect);
        else if (items.length && !preselect) setItemId(items[0].id);
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load items', 'error'))
      .finally(() => setLoading(false));
  }, [toast, preselect]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const selectedId = String(fd.get('itemId') || itemId);
    setSaving(true);
    try {
      await inventoryService.stockOut(selectedId, {
        date: String(fd.get('date')),
        quantity: Number(fd.get('quantity')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Stock out recorded');
      router.push(`/inventory/${selectedId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record stock out', 'error');
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading items…" />;

  return (
    <div>
      <PageHeader title="Stock Out" description="Remove quantity from inventory." />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Select
            name="itemId"
            label="Item"
            required
            options={options}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="Select item"
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
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/inventory">
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

export default function StockOutPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <StockOutForm />
    </Suspense>
  );
}
