'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { workersService } from '@/services/workers';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, Input, Select, Textarea, Button } from '@/components/ui';
import type { WorkerStatus } from '@/types/farm';

export default function NewWorkerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await workersService.create({
        name: String(fd.get('name') ?? '').trim(),
        phone: String(fd.get('phone') ?? '').trim(),
        role: String(fd.get('role') ?? '').trim(),
        salary: Number(fd.get('salary')),
        joiningDate: String(fd.get('joiningDate')),
        status: String(fd.get('status')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Worker saved');
      router.push('/workers');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save worker', 'error');
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Worker" description="Register a new farm worker." />
      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Full Name" required disabled={saving} />
          <Input name="phone" label="Phone" required disabled={saving} />
          <Input name="role" label="Role" required disabled={saving} />
          <Input
            name="salary"
            label="Monthly Salary (Rs.)"
            type="number"
            required
            disabled={saving}
          />
          <Input
            name="joiningDate"
            label="Joining Date"
            type="date"
            required
            disabled={saving}
          />
          <Select
            name="status"
            label="Status"
            required
            disabled={saving}
            options={(['Active', 'Inactive'] as WorkerStatus[]).map((s) => ({
              label: s,
              value: s,
            }))}
          />
          <div className="sm:col-span-2">
            <Textarea name="notes" label="Notes" rows={3} disabled={saving} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Link href="/workers">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
