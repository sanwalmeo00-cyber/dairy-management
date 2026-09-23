'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';

export default function NewGoatPurchasePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const goatOptions = mockGoats.map((g) => ({ label: `${g.name} (${g.tagNumber})`, value: g.id }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast(`Goat purchase saved for ${currentUser.name} (mock)`);
    router.push('/goat-purchases');
  };

  return (
    <div>
      <PageHeader title="Record Goat Purchase" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Purchase Date" type="date" required />
          <Select name="goatId" label="Goat" required options={goatOptions} placeholder="Select goat" />
          <Input name="seller" label="Seller" required className="sm:col-span-2" />
          <Input name="purchasePrice" label="Purchase Price (Rs.)" type="number" required />
          <Select
            name="paymentStatus"
            label="Payment Status"
            required
            options={['Paid', 'Unpaid', 'Partial'].map((s) => ({ label: s, value: s }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/goat-purchases">
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
