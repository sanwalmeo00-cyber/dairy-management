'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dailyUsageRaw = String(fd.get('dailyUsage') ?? '').trim();
    const expiryRaw = String(fd.get('expiryDate') ?? '').trim();
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
    }
  };

  return (
    <div>
      <PageHeader title="Add Inventory Item" description="Track a new feed, medicine, or supply." />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Item Name" required className="sm:col-span-2" />
          <Select
            name="category"
            label="Category"
            required
            options={categories.map((c) => ({ label: c, value: c }))}
          />
          <Input name="unit" label="Unit (bags, boxes, vials…)" required />
          <Input name="currentStock" label="Opening Stock" type="number" min={0} step="0.01" defaultValue={0} />
          <Input name="minimumStock" label="Minimum Stock" type="number" min={0} step="0.01" required />
          <Input name="cost" label="Unit Cost (Rs.)" type="number" min={0} step="0.01" required />
          <Input
            name="dailyUsage"
            label="Daily Usage (optional)"
            type="number"
            min={0}
            step="0.01"
            hint="Used to estimate days left"
          />
          <Input name="expiryDate" label="Expiry Date (optional)" type="date" />
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
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
