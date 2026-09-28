'use client';

import { useEffect, useMemo, useState } from 'react';
import { paymentsService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Transaction } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  StatCard,
  Badge,
  statusTone,
  OwnerBadge,
  EmptyState,
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

export default function PaymentsPage() {
  const { isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await paymentsService.getAll());
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load payments', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (type && r.type !== type) return false;
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [rows, search, type]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${type}`
  );

  const income = filtered.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  return (
    <div>
      <PageHeader title="Payments" description="Income and expense transactions across the farm." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Income" value={formatCurrency(income)} />
        <StatCard label="Total Expenses" value={formatCurrency(expense)} />
        <StatCard label="Net (filtered)" value={formatCurrency(net)} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search transactions…"
          className="sm:max-w-xs"
        />
        <Select
          options={[
            { label: 'Income', value: 'Income' },
            { label: 'Expense', value: 'Expense' },
          ]}
          placeholder="All types"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="sm:w-40"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading payments…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                title="No transactions"
                description="Adjust filters to see payment activity."
              />
            }
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'desc', header: 'Description', render: (r) => r.description },
              { key: 'type', header: 'Type', render: (r) => r.type },
              { key: 'cat', header: 'Category', render: (r) => r.category },
              {
                key: 'amount',
                header: 'Amount',
                render: (r) => (
                  <span className={r.type === 'Income' ? 'text-emerald-700' : 'text-red-700'}>
                    {r.type === 'Income' ? '+' : '-'}
                    {formatCurrency(r.amount)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
              },
              {
                key: 'owner',
                header: 'Owner',
                render: (r) => <OwnerBadge name={r.ownerName} isOwn={isOwnerOf(r.ownerId)} />,
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
