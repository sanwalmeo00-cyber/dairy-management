'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { workersService } from '@/services/dashboard';
import { useToast } from '@/context/ToastContext';
import type { Worker } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Badge,
  statusTone,
  Button,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function WorkersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void workersService.getAll().then(setRows);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((w) => {
      if (status && w.status !== status) return false;
      if (!q) return true;
      return w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q) || w.phone.includes(q);
    });
  }, [rows, search, status]);

  return (
    <div>
      <PageHeader title="Workers" description="Farm staff and salary records." action={{ label: 'Add Worker', href: '/workers/new' }} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, role…" className="sm:max-w-xs" />
        <Select
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-40"
        />
      </div>
      <Table
        data={filtered}
        rowKey={(w) => w.id}
        empty={<EmptyState title="No workers" description="Add a worker to manage payroll." />}
        columns={[
          { key: 'name', header: 'Name', render: (w) => w.name },
          { key: 'role', header: 'Role', render: (w) => w.role },
          { key: 'phone', header: 'Phone', render: (w) => w.phone },
          { key: 'salary', header: 'Salary', render: (w) => formatCurrency(w.salary) },
          { key: 'joined', header: 'Joined', render: (w) => formatDate(w.joiningDate) },
          {
            key: 'status',
            header: 'Status',
            render: (w) => <Badge tone={statusTone(w.status)}>{w.status}</Badge>,
          },
          {
            key: 'owner',
            header: 'Owner',
            render: () => <Badge tone="neutral">Shared</Badge>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (w) => (
              <div className="flex justify-end gap-1">
                <Link href={`/workers/${w.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                <Link href="/workers/new">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(w.id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          setRows((p) => p.filter((x) => x.id !== deleteId));
          toast('Worker removed (mock)');
          setDeleteId(null);
        }}
        title="Delete worker"
        description="Remove this worker from the mock list?"
      />
    </div>
  );
}
