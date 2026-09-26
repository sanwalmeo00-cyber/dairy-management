'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { inventoryService } from '@/services/inventory';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { InventoryCategory } from '@/types/farm';

const categories: InventoryCategory[] = [
  'Goat Feed',
  'Medicine',
  'Vaccines',
  'Equipment',
  'Other Supplies',
];

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const dailyUsageRaw = String(fd.get('dailyUsage') ?? '').trim();
    const expiryRaw = String(fd.get('expiryDate') ?? '').trim();
    setSaving(true);
    try {
      const item = await inventoryService.create({
        name: String(fd.get('name') ?? '').trim(),
        category: String(fd.get('category')) as InventoryCategory,
        unit: String(fd.get('unit') ?? '').trim(),
        currentStock: Number(fd.get('currentStock') || 0),
        minimumStock: Number(fd.get('minimumStock')),
        cost: Number(fd.get('cost')),
        dailyUsage: dailyUsageRaw ? Number(dailyUsageRaw) : null,
        expiryDate: expiryRaw || null,
        supplier: String(fd.get('supplier') ?? '') || null,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Inventory item saved');
      router.push(`/inventory/${item.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save item', 'error');
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Inventory Item" description="Track a new feed, medicine, or supply." />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label="Item Name"
            required
            className="sm:col-span-2"
            disabled={saving}
          />
          <Select
            name="category"
            label="Category"
            required
            disabled={saving}
            options={categories.map((c) => ({ label: c, value: c }))}
          />
          <Input name="unit" label="Unit (bags, boxes, vials…)" required disabled={saving} />
          <Input
            name="currentStock"
            label="Opening Stock"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
            disabled={saving}
          />
          <Input
            name="minimumStock"
            label="Minimum Stock"
            type="number"
            min={0}
            step="0.01"
            required
            disabled={saving}
          />
          <Input
            name="cost"
            label="Unit Cost (Rs.)"
            type="number"
            min={0}
            step="0.01"
            required
            disabled={saving}
          />
          <Input
            name="dailyUsage"
            label="Daily Usage (optional)"
            type="number"
            min={0}
            step="0.01"
            hint="Used to estimate days left"
            disabled={saving}
          />
          <Input name="expiryDate" label="Expiry Date (optional)" type="date" disabled={saving} />
          <Input name="supplier" label="Supplier" className="sm:col-span-2" disabled={saving} />
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
