'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { WorkerStatus } from '@/types/farm';

export default function NewWorkerPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast('Worker saved (mock)');
    router.push('/workers');
  };

  return (
    <div>
      <PageHeader title="Add Worker" description="Register a new farm worker." />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Full Name" required />
          <Input name="phone" label="Phone" required />
          <Input name="role" label="Role" required />
          <Input name="salary" label="Monthly Salary (Rs.)" type="number" required />
          <Input name="joiningDate" label="Joining Date" type="date" required />
          <Select
            name="status"
            label="Status"
            required
            options={(['Active', 'Inactive'] as WorkerStatus[]).map((s) => ({ label: s, value: s }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/workers">
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
