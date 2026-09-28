'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Button,
  OwnerBadge,
  EmptyState,
  ConfirmDialog,
  Modal,
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

export type CashbookKind = 'sale' | 'animalsale' | 'purchase' | 'expense' | 'cashout';

type CashbookEntry = {
  id: string;
  kind: CashbookKind;
  date: string;
  description: string;
  notes?: string | null;
  party: string;
  amount: number;
  direction: 'in' | 'out';
  status?: string;
  ownerId: string;
  ownerName: string;
  addedById: string;
  addedByName: string;
};

function isAnimalSale(r: Sale) {
  return Boolean(r.goatId) || Boolean(r.tagNumber && r.tagNumber !== '—');
}

function toEntries(
  sales: Sale[],
  purchases: GoatPurchase[],
  expenses: Expense[]
): CashbookEntry[] {
  return [
    ...sales.map((r) => {
      const animal = isAnimalSale(r);
      return {
        id: `sale-${r.id}`,
        kind: (animal ? 'animalsale' : 'sale') as CashbookKind,
        date: r.date,
        description: animal
          ? `Animal sale · tag ${r.tagNumber}`
          : `Money in · ${r.buyer}`,
        notes: r.notes ?? null,
        party: r.buyer,
        amount: r.salePrice,
        direction: 'in' as const,
        status: r.paymentStatus,
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        addedById: r.addedById ?? r.ownerId,
        addedByName: r.addedByName ?? r.ownerName,
      };
    }),
    ...purchases.map((r) => ({
      id: `purchase-${r.id}`,
      kind: 'purchase' as const,
      date: r.date,
      description: `Purchase · tag ${r.tagNumber}`,
      notes: r.notes ?? null,
      party: r.tagNumber,
      amount: r.purchasePrice,
      direction: 'out' as const,
      status: r.paymentStatus,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      addedById: r.addedById ?? r.ownerId,
      addedByName: r.addedByName ?? r.ownerName,
    })),
    ...expenses.map((r) => {
      const isCashOut = r.category === 'Partner Payout';
      return {
        id: `expense-${r.id}`,
        kind: (isCashOut ? 'cashout' : 'expense') as CashbookKind,
        date: r.date,
        description: r.description,
        notes: r.notes ?? null,
        party: isCashOut
          ? r.description.replace(/^Cash out ·\s*/i, '') || r.category
          : r.category,
        amount: r.amount,
        direction: 'out' as const,
        status: r.paymentMethod,
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        addedById: r.addedById ?? r.ownerId,
        addedByName: r.addedByName ?? r.ownerName,
      };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description));
}

const KIND_LABEL: Record<CashbookKind, string> = {
  sale: 'Money in',
  animalsale: 'Animal sale',
  purchase: 'Purchase',
  expense: 'Expense',
  cashout: 'Cash out',
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
  const [detail, setDetail] = useState<CashbookEntry | null>(null);
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
      if (userId && r.addedById !== userId) return false;
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q) ||
        r.party.toLowerCase().includes(q) ||
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
  const wallet = moneyIn - moneyOut;

  /** Profit = business income − business costs. Partner investment / cash-out are capital, not profit. */
  const businessIncome = filtered
    .filter((r) => r.kind === 'animalsale')
    .reduce((s, r) => s + r.amount, 0);
  const businessCosts = filtered
    .filter((r) => r.kind === 'purchase' || r.kind === 'expense')
    .reduce((s, r) => s + r.amount, 0);
  const profit = businessIncome - businessCosts;

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
        // expense + cashout both stored as Expense
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
        description="Wallet = all cash in/out. Profit = animal sales − purchases & expenses (partner investment is not profit)."
        action={{ label: 'Add record', href: '/cashbook/new' }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Money In"
          value={formatCurrency(moneyIn)}
          hint="Investment + animal sales → wallet"
        />
        <StatCard
          label="Money Out"
          value={formatCurrency(moneyOut)}
          hint="Purchases, expenses, cash out"
        />
        <StatCard
          label="Wallet"
          value={formatCurrency(wallet)}
          hint="Cash left (In − Out)"
        />
        <StatCard
          label={profit >= 0 ? 'Profit' : 'Loss'}
          value={formatCurrency(Math.abs(profit))}
          hint="Animal sales − purchases & expenses (investment not counted)"
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
            { label: 'Money in', value: 'sale' },
            { label: 'Animal sale', value: 'animalsale' },
            { label: 'Cash out', value: 'cashout' },
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
          placeholder="Added by"
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
            onRowClick={setDetail}
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
                      r.kind === 'sale' || r.kind === 'animalsale'
                        ? 'success'
                        : r.kind === 'cashout'
                          ? 'danger'
                          : r.kind === 'purchase'
                            ? 'info'
                            : 'warning'
                    }
                  >
                    {KIND_LABEL[r.kind]}
                  </Badge>
                ),
              },
              {
                key: 'desc',
                header: 'Description',
                className: 'max-w-[12rem] truncate whitespace-nowrap md:max-w-[16rem]',
                render: (r) => (
                  <span className="block max-w-[12rem] truncate md:max-w-[16rem]" title={r.description}>
                    {r.description}
                  </span>
                ),
              },
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
                key: 'addedBy',
                header: 'Record added by',
                render: (r) => (
                  <OwnerBadge name={r.addedByName} isOwn={isOwnerOf(r.addedById)} />
                ),
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

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? KIND_LABEL[detail.kind] : 'Entry detail'}
        footer={
          detail && canModifyRecord(detail.ownerId) ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                className="w-full sm:w-auto"
                onClick={() => {
                  setDeleteTarget(detail);
                  setDetail(null);
                }}
              >
                Delete
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {detail && (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-fg">Date</dt>
              <dd className="font-medium">{formatDate(detail.date)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Type</dt>
              <dd className="font-medium">{KIND_LABEL[detail.kind]}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Amount</dt>
              <dd
                className={
                  detail.direction === 'in'
                    ? 'font-medium text-emerald-700'
                    : 'font-medium text-red-700'
                }
              >
                {detail.direction === 'in' ? '+' : '−'}
                {formatCurrency(detail.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg">Party</dt>
              <dd className="font-medium break-words">{detail.party}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Description</dt>
              <dd className="whitespace-pre-wrap break-words font-medium">{detail.description}</dd>
            </div>
            {detail.notes?.trim() ? (
              <div>
                <dt className="text-muted-fg">Notes</dt>
                <dd className="whitespace-pre-wrap break-words font-medium">{detail.notes}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-fg">Record added by</dt>
              <dd className="mt-1">
                <OwnerBadge name={detail.addedByName} isOwn={isOwnerOf(detail.addedById)} />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

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
