'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { goatPurchasesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';

export default function NewGoatPurchasePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await goatPurchasesService.create({
        date: String(fd.get('date')),
        tagNumber: String(fd.get('tagNumber') ?? '').trim(),
        seller: String(fd.get('seller') ?? '').trim(),
        purchasePrice: Number(fd.get('purchasePrice')),
        paymentStatus: String(fd.get('paymentStatus')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Goat purchase saved for ${currentUser.name}`);
      router.push('/goat-purchases');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save goat purchase', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Record Goat Purchase" description={`Owned by ${currentUser.name}.`} />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Input name="date" label="Purchase Date" type="date" required />
          <Input name="tagNumber" label="Tag Number" required placeholder="e.g. G001" />
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
