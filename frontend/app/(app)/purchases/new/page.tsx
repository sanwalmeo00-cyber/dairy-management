'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { PurchaseCategory, PaymentMethod } from '@/types/farm';

export default function NewPurchasePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast(`Purchase saved for ${currentUser.name} (mock)`);
    router.push('/purchases');
  };

  return (
    <div>
      <PageHeader title="Add Purchase" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Date" type="date" required />
          <Select
            name="category"
            label="Category"
            required
            options={(
              ['Feed', 'Medicine', 'Equipment', 'Transportation', 'Supplies', 'Other'] as PurchaseCategory[]
            ).map((c) => ({ label: c, value: c }))}
          />
          <Input name="description" label="Description" required className="sm:col-span-2" />
          <Input name="vendor" label="Vendor" required />
          <Input name="quantity" label="Quantity" type="number" required />
          <Input name="unitPrice" label="Unit Price (Rs.)" type="number" required />
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
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/purchases">
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
