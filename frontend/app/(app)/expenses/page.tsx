'use client';

import { useEffect, useMemo, useState } from 'react';
import { expensesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
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
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await expensesService.getAll());
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load expenses', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (category && r.category !== category) return false;
      if (!q) return true;
      return r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    });
  }, [rows, search, category]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const expense = rows.find((r) => r.id === deleteId);
    if (!expense || !canModifyRecord(expense.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await expensesService.remove(expense.id);
      setRows((prev) => prev.filter((r) => r.id !== expense.id));
      toast('Expense deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Operating costs for the farm."
        action={{ label: 'Add Expense', href: '/expenses/new' }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search description…"
          className="sm:max-w-xs"
        />
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
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No expenses'}
            description={loading ? 'Fetching from the server.' : 'Add an expense to track spending.'}
          />
        }
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
                {canModifyRecord(r.ownerId) && (
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
                    Delete
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete expense?"
        description={
          pending
            ? `“${pending.description}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
