'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { PaymentMethod } from '@/types/farm';

export default function NewSalePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const goatOptions = mockGoats.map((g) => ({ label: `${g.name} (${g.tagNumber})`, value: g.id }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast(`Sale saved for ${currentUser.name} (mock)`);
    router.push('/sales');
  };

  return (
    <div>
      <PageHeader title="Record Sale" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Sale Date" type="date" required />
          <Select name="goatId" label="Goat" required options={goatOptions} placeholder="Select goat" />
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
