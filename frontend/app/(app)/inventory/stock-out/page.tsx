'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { inventoryService } from '@/services/dashboard';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Select, Input, Textarea, Button } from '@/components/ui';

export default function StockOutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    void inventoryService.getAll().then((items) =>
      setOptions(items.map((i) => ({ label: i.name, value: i.id })))
    );
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast('Stock out recorded (mock)');
    router.push('/inventory');
  };

  return (
    <div>
      <PageHeader title="Stock Out" description="Remove quantity from inventory." />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Select name="itemId" label="Item" required options={options} placeholder="Select item" />
          <Input name="date" label="Date" type="date" required />
          <Input name="quantity" label="Quantity" type="number" min={1} required />
          <Input name="reason" label="Reason" required className="sm:col-span-2" />
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
