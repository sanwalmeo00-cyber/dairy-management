'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { inventoryService } from '@/services/inventory';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import { isExpirableCategory } from '@/lib/inventoryExpiry';
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
  const [category, setCategory] = useState<InventoryCategory>('Goat Feed');
  const needsExpiry = isExpirableCategory(category);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const expiryDate = String(fd.get('expiryDate') ?? '').trim() || null;
    if (needsExpiry && !expiryDate) {
      toast('Expiration date is required for medicine and vaccines', 'error');
      return;
    }
    setSaving(true);
    try {
      const item = await inventoryService.create({
        name: String(fd.get('name') ?? '').trim(),
        category,
        unit: String(fd.get('unit') ?? '').trim(),
        expiryDate,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Item saved — use Stock In to add quantity and purchase cost');
      router.push(`/inventory/${item.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save item', 'error');
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Inventory Item"
        description="Create the item first. Quantity and purchase cost are recorded on Stock In."
      />
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
            value={category}
            onChange={(e) => setCategory(e.target.value as InventoryCategory)}
            options={categories.map((c) => ({ label: c, value: c }))}
          />
          <Input name="unit" label="Unit (bags, boxes, vials…)" required disabled={saving} />
          {needsExpiry && (
            <Input
              name="expiryDate"
              label="Expiration date"
              type="date"
              required
              disabled={saving}
              className="sm:col-span-2"
              hint="After this date, remaining stock is marked expired and removed from in-stock"
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
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
