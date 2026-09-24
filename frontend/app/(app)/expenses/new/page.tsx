'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { expensesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { ExpenseCategory, PaymentMethod } from '@/types/farm';

export default function NewExpensePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await expensesService.create({
        date: String(fd.get('date')),
        category: String(fd.get('category')),
        description: String(fd.get('description') ?? '').trim(),
        amount: Number(fd.get('amount')),
        paymentMethod: String(fd.get('paymentMethod')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Expense saved for ${currentUser.name}`);
      router.push('/expenses');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save expense', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Add Expense" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
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
