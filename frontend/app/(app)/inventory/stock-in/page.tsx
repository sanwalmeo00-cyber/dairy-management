'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { inventoryService } from '@/services/inventory';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Select, Input, Textarea, Button } from '@/components/ui';

export default function StockInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void inventoryService
      .getAll()
      .then((items) =>
        setOptions(items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id })))
      )
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load items', 'error'));
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const itemId = String(fd.get('itemId'));
    const costRaw = String(fd.get('cost') ?? '').trim();
    setSaving(true);
    try {
      await inventoryService.stockIn(itemId, {
        date: String(fd.get('date')),
        quantity: Number(fd.get('quantity')),
        cost: costRaw ? Number(costRaw) : null,
        supplier: String(fd.get('supplier') ?? '') || null,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Stock in recorded');
      router.push(`/inventory/${itemId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record stock in', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock In" description="Add quantity to inventory." />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Select name="itemId" label="Item" required options={options} placeholder="Select item" />
          <Input name="date" label="Date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          <Input name="quantity" label="Quantity" type="number" min={0.01} step="0.01" required />
          <Input name="cost" label="Total Cost (Rs.)" type="number" min={0} step="0.01" />
          <Input name="supplier" label="Supplier" className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/inventory">
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
