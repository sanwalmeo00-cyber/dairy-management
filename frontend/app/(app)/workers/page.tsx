'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { workersService } from '@/services/workers';
import { useAuth } from '@/context/AuthContext';
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
  OwnerBadge,
  EmptyState,
  ConfirmDialog,
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

export default function WorkersPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await workersService.getAll());
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load workers', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((w) => {
      if (status && w.status !== status) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.phone.includes(q)
      );
    });
  }, [rows, search, status]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${status}`
  );

  const confirmDelete = async () => {
    if (!deleteId) return;
    const worker = rows.find((w) => w.id === deleteId);
    if (!worker || !canModifyRecord(worker.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await workersService.remove(worker.id);
      setRows((prev) => prev.filter((w) => w.id !== worker.id));
      toast('Worker deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((w) => w.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Workers"
        description="Farm staff, monthly salary, and payment records."
        action={{ label: 'Add Worker', href: '/workers/new' }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, role…"
          className="sm:max-w-xs"
        />
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
      {loading ? (
        <LoadingState label="Loading workers…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(w) => w.id}
            empty={
              <EmptyState title="No workers" description="Add a worker to manage payroll." />
            }
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
                render: (w) => <OwnerBadge name={w.ownerName} isOwn={isOwnerOf(w.ownerId)} />,
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
                    {canModifyRecord(w.ownerId) && (
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(w.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete worker?"
        description={
          pending
            ? `“${pending.name}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
