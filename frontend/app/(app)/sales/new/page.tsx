'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { salesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { PaymentMethod } from '@/types/farm';

export default function NewSalePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await salesService.create({
        date: String(fd.get('date')),
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        buyer: String(fd.get('buyer') ?? '').trim(),
        salePrice: Number(fd.get('salePrice')),
        paymentStatus: String(fd.get('paymentStatus')),
        paymentMethod: String(fd.get('paymentMethod')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Sale saved for ${currentUser.name}`);
      router.push('/sales');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save sale', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Record Sale" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Sale Date" type="date" required />
          <Input name="tagNumber" label="Tag Number" required placeholder="e.g. G001" />
          <Input name="buyer" label="Buyer" required className="sm:col-span-2" />
          <Input name="salePrice" label="Sale Price (Rs.)" type="number" required />
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
            <Link href="/sales">
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
