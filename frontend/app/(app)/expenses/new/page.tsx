'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { ExpenseCategory, PaymentMethod } from '@/types/farm';

export default function NewExpensePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast(`Expense saved for ${currentUser.name} (mock)`);
    router.push('/expenses');
  };

  return (
    <div>
      <PageHeader title="Add Expense" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Date" type="date" required />
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
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/expenses">
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
