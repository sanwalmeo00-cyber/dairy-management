'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  expensesService,
  goatPurchasesService,
  salesService,
} from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Expense, GoatPurchase, Sale } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  StatCard,
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

export type CashbookKind = 'sale' | 'purchase' | 'expense';

type CashbookEntry = {
  id: string;
  kind: CashbookKind;
  date: string;
  description: string;
  party: string;
  amount: number;
  direction: 'in' | 'out';
  status?: string;
  ownerId: string;
  ownerName: string;
  addedById: string;
  addedByName: string;
  cashHandlerId: string;
  cashHandlerName: string;
};

function toEntries(
  sales: Sale[],
  purchases: GoatPurchase[],
  expenses: Expense[]
): CashbookEntry[] {
  return [
    ...sales.map((r) => ({
      id: `sale-${r.id}`,
      kind: 'sale' as const,
      date: r.date,
      description: `Sale · tag ${r.tagNumber}`,
      party: r.buyer,
      amount: r.salePrice,
      direction: 'in' as const,
      status: r.paymentStatus,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      addedById: r.addedById ?? r.ownerId,
      addedByName: r.addedByName ?? r.ownerName,
      cashHandlerId: r.cashHandlerId ?? r.ownerId,
      cashHandlerName: r.cashHandlerName ?? r.ownerName,
    })),
    ...purchases.map((r) => ({
      id: `purchase-${r.id}`,
      kind: 'purchase' as const,
      date: r.date,
      description: `Purchase · tag ${r.tagNumber}`,
      party: r.seller,
      amount: r.purchasePrice,
      direction: 'out' as const,
      status: r.paymentStatus,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      addedById: r.addedById ?? r.ownerId,
      addedByName: r.addedByName ?? r.ownerName,
      cashHandlerId: r.cashHandlerId ?? r.ownerId,
      cashHandlerName: r.cashHandlerName ?? r.ownerName,
    })),
    ...expenses.map((r) => ({
      id: `expense-${r.id}`,
      kind: 'expense' as const,
      date: r.date,
      description: r.description,
      party: r.category,
      amount: r.amount,
      direction: 'out' as const,
      status: r.paymentMethod,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      addedById: r.addedById ?? r.ownerId,
      addedByName: r.addedByName ?? r.ownerName,
      cashHandlerId: r.cashHandlerId ?? r.ownerId,
      cashHandlerName: r.cashHandlerName ?? r.ownerName,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description));
}

const KIND_LABEL: Record<CashbookKind, string> = {
  sale: 'Sale',
  purchase: 'Purchase',
  expense: 'Expense',
};

export default function CashbookPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<GoatPurchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [userId, setUserId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CashbookEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, e] = await Promise.all([
        salesService.getAll(),
        goatPurchasesService.getAll(),
        expensesService.getAll(),
      ]);
      setSales(s);
      setPurchases(p);
      setExpenses(e);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load cashbook', 'error');
      setSales([]);
      setPurchases([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = useMemo(() => toEntries(sales, purchases, expenses), [sales, purchases, expenses]);

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) {
      map.set(e.cashHandlerId, e.cashHandlerName);
      map.set(e.addedById, e.addedByName);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((r) => {
      if (kind && r.kind !== kind) return false;
      if (userId && r.cashHandlerId !== userId && r.addedById !== userId) return false;
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        r.party.toLowerCase().includes(q) ||
        r.cashHandlerName.toLowerCase().includes(q) ||
        r.addedByName.toLowerCase().includes(q) ||
        KIND_LABEL[r.kind].toLowerCase().includes(q)
      );
    });
  }, [entries, search, kind, userId]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${kind}|${userId}`
  );

  const moneyIn = filtered
    .filter((r) => r.direction === 'in')
    .reduce((s, r) => s + r.amount, 0);
  const moneyOut = filtered
    .filter((r) => r.direction === 'out')
    .reduce((s, r) => s + r.amount, 0);
  const net = moneyIn - moneyOut;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canModifyRecord(deleteTarget.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteTarget(null);
      return;
    }
    const rawId = deleteTarget.id.replace(/^(sale|purchase|expense)-/, '');
    try {
      if (deleteTarget.kind === 'sale') {
        await salesService.remove(rawId);
        setSales((prev) => prev.filter((r) => r.id !== rawId));
      } else if (deleteTarget.kind === 'purchase') {
        await goatPurchasesService.remove(rawId);
        setPurchases((prev) => prev.filter((r) => r.id !== rawId));
      } else {
        await expensesService.remove(rawId);
        setExpenses((prev) => prev.filter((r) => r.id !== rawId));
      }
      toast('Entry deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Cashbook"
        description="All sales, purchases, and expenses. Filter by type and who paid or received money."
      >
        <Link href="/cashbook/new?type=sale">
          <Button variant="outline">Record Sale</Button>
        </Link>
        <Link href="/cashbook/new?type=purchase">
          <Button variant="outline">Record Purchase</Button>
        </Link>
        <Link href="/cashbook/new?type=expense">
          <Button>Add Expense</Button>
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Money In" value={formatCurrency(moneyIn)} hint="Sales (filtered)" />
        <StatCard label="Money Out" value={formatCurrency(moneyOut)} hint="Purchases & expenses" />
        <StatCard
          label={net >= 0 ? 'Net Profit' : 'Net Loss'}
          value={formatCurrency(Math.abs(net))}
          hint="Based on current filters"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search description, party…"
          className="sm:max-w-xs"
        />
        <Select
          options={[
            { label: 'Sales', value: 'sale' },
            { label: 'Purchases', value: 'purchase' },
            { label: 'Expenses', value: 'expense' },
          ]}
          placeholder="All types"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="sm:w-40"
        />
        <Select
          options={userOptions}
          placeholder="All users"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="sm:w-44"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading cashbook…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                title="No cashbook entries"
                description="Record a sale, purchase, or expense to get started."
              />
            }
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              {
                key: 'type',
                header: 'Type',
                render: (r) => (
                  <Badge
                    tone={
                      r.kind === 'sale' ? 'success' : r.kind === 'purchase' ? 'info' : 'warning'
                    }
                  >
                    {KIND_LABEL[r.kind]}
                  </Badge>
                ),
              },
              { key: 'desc', header: 'Description', render: (r) => r.description },
              { key: 'party', header: 'Party', render: (r) => r.party },
              {
                key: 'amount',
                header: 'Amount',
                render: (r) => (
                  <span className={r.direction === 'in' ? 'text-emerald-700' : 'text-red-700'}>
                    {r.direction === 'in' ? '+' : '−'}
                    {formatCurrency(r.amount)}
                  </span>
                ),
              },
          {
            key: 'money',
            header: 'Paid / Received by',
            render: (r) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-fg">
                  {r.direction === 'in' ? 'Received' : 'Paid'}
                </span>
                <OwnerBadge
                  name={r.cashHandlerName}
                  isOwn={isOwnerOf(r.cashHandlerId)}
                />
              </div>
            ),
          },
          {
            key: 'addedBy',
            header: 'Record added by',
            render: (r) => (
              <OwnerBadge name={r.addedByName} isOwn={isOwnerOf(r.addedById)} />
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) =>
              r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '—',
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r) =>
              canModifyRecord(r.ownerId) ? (
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(r)}>
                  Delete
                </Button>
              ) : null,
          },
        ]}
      />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete cashbook entry?"
        description={
          deleteTarget
            ? `“${deleteTarget.description}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
