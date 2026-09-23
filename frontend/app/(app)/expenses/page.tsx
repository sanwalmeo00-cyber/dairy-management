'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { expensesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Expense } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Button,
  OwnerBadge,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ExpensesPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void expensesService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'expense'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((r) => {
      if (category && r.category !== category) return false;
      if (!q) return true;
      return r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    });
  }, [activeRows, search, category]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const expense = rows.find((r) => r.id === deleteId);
    if (!expense || !canModifyRecord(expense.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'expense',
      recordId: expense.id,
      label: expense.description,
      ownerId: expense.ownerId,
      ownerName: expense.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader title="Expenses" description="Operating costs for the farm." action={{ label: 'Add Expense', href: '/expenses/new' }} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search description…" className="sm:max-w-xs" />
        <Select
          options={[
            'Feed',
            'Medicine',
            'Veterinary',
            'Worker Salary',
            'Transport',
            'Equipment',
            'Maintenance',
            'Utilities',
            'Other',
          ].map((c) => ({ label: c, value: c }))}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-44"
        />
      </div>
      <Table
        data={filtered}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No expenses" description="Add an expense to track spending." />}
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'desc', header: 'Description', render: (r) => r.description },
          { key: 'cat', header: 'Category', render: (r) => r.category },
          { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
          { key: 'method', header: 'Method', render: (r) => r.paymentMethod },
          {
            key: 'owner',
            header: 'Owner',
            render: (r) => <OwnerBadge name={r.ownerName} isOwn={isOwnerOf(r.ownerId)} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => toast(`${r.description} — ${formatCurrency(r.amount)} (mock view)`)}>
                  View
                </Button>
                {canModifyRecord(r.ownerId) && (
                  <>
                    <Link href="/expenses/new">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete expense?"
        description={
          pending
            ? `“${pending.description}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
