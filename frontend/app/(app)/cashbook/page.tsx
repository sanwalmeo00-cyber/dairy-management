'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  expensesService,
  goatPurchasesService,
  salesService,
} from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Expense, ExpenseCategory, GoatPurchase, Sale } from '@/types/farm';
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
  Input,
  Textarea,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  isAnimalSale,
  isMilkSale,
  MILK_SALE_NOTE_PREFIX,
  MILK_SALE_TAG,
  milkSaleNotes,
} from '@/lib/cashbookMarkers';
import { usePagedList } from '@/lib/usePagedList';

export type CashbookKind =
  | 'sale'
  | 'milksale'
  | 'animalsale'
  | 'purchase'
  | 'expense'
  | 'cashout';

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
  /** Underlying category for expenses */
  category?: string;
  tagNumber?: string;
};

function saleKind(r: Sale): CashbookKind {
  if (isMilkSale(r)) return 'milksale';
  if (isAnimalSale(r)) return 'animalsale';
  return 'sale';
}

function toEntries(
  sales: Sale[],
  purchases: GoatPurchase[],
  expenses: Expense[]
): CashbookEntry[] {
  return [
    ...sales.map((r) => {
      const kind = saleKind(r);
      return {
        id: `sale-${r.id}`,
        kind,
        date: r.date,
        description:
          kind === 'animalsale'
            ? `Animal sale · tag ${r.tagNumber}`
            : kind === 'milksale'
              ? `Milk sale · ${r.buyer}`
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
        tagNumber: r.tagNumber,
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
      tagNumber: r.tagNumber,
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
        category: r.category,
      };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description));
}

const KIND_LABEL: Record<CashbookKind, string> = {
  sale: 'Money in',
  milksale: 'Milk sale',
  animalsale: 'Animal sale',
  purchase: 'Purchase',
  expense: 'Expense',
  cashout: 'Cash out',
};

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Feed',
  'Medicine',
  'Veterinary',
  'Worker Salary',
  'Transport',
  'Equipment',
  'Maintenance',
  'Utilities',
  'Other',
];

function rawRecordId(entry: CashbookEntry) {
  return entry.id.replace(/^(sale|purchase|expense)-/, '');
}

function isSaleKind(kind: CashbookKind) {
  return kind === 'sale' || kind === 'animalsale' || kind === 'milksale';
}

function stripMilkSaleNotes(notes?: string | null) {
  if (!notes) return '';
  const lines = notes.split('\n');
  if (lines[0]?.startsWith(MILK_SALE_NOTE_PREFIX)) {
    return lines.slice(1).join('\n').trim();
  }
  return notes;
}

function milkKgFromNotes(notes?: string | null): string {
  if (!notes) return '';
  const m = notes.match(/^Milk sale · ([\d.]+) kg/);
  return m?.[1] ?? '';
}

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editParty, setEditParty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editMilkKg, setEditMilkKg] = useState('');
  const [editCategory, setEditCategory] = useState('Other');

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

  const businessIncome = filtered
    .filter((r) => r.kind === 'animalsale' || r.kind === 'milksale')
    .reduce((s, r) => s + r.amount, 0);
  const businessCosts = filtered
    .filter((r) => r.kind === 'purchase' || r.kind === 'expense')
    .reduce((s, r) => s + r.amount, 0);
  const profit = businessIncome - businessCosts;

  function openDetail(entry: CashbookEntry) {
    setDetail(entry);
    setEditing(false);
  }

  function startEdit(entry: CashbookEntry) {
    setEditDate(entry.date);
    setEditAmount(String(entry.amount));
    setEditParty(entry.party);
    setEditNotes(
      entry.kind === 'milksale' ? stripMilkSaleNotes(entry.notes) : (entry.notes ?? '')
    );
    setEditMilkKg(entry.kind === 'milksale' ? milkKgFromNotes(entry.notes) : '');
    setEditTag(
      entry.tagNumber && entry.tagNumber !== '—' && entry.tagNumber !== MILK_SALE_TAG
        ? entry.tagNumber
        : ''
    );
    setEditCategory(
      entry.kind === 'expense' && entry.category && entry.category !== 'Partner Payout'
        ? entry.category
        : 'Other'
    );
    setEditing(true);
  }

  function closeDetail() {
    if (saving) return;
    setDetail(null);
    setEditing(false);
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canModifyRecord(deleteTarget.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteTarget(null);
      return;
    }
    const rawId = rawRecordId(deleteTarget);
    try {
      if (isSaleKind(deleteTarget.kind)) {
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
      if (detail?.id === deleteTarget.id) closeDetail();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteTarget(null);
  };

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!detail || saving) return;
    if (!canModifyRecord(detail.ownerId)) {
      toast('You cannot edit another user’s record', 'error');
      return;
    }

    const amount = Number(editAmount);
    if (!(amount >= 0) || Number.isNaN(amount)) {
      toast('Enter a valid amount', 'error');
      return;
    }

    const rawId = rawRecordId(detail);
    setSaving(true);
    try {
      if (isSaleKind(detail.kind)) {
        const kg = editMilkKg.trim() ? Number(editMilkKg) : null;
        if (detail.kind === 'milksale' && editMilkKg.trim() && (!(kg! > 0) || Number.isNaN(kg))) {
          toast('Enter a valid milk quantity in kg', 'error');
          setSaving(false);
          return;
        }
        const updated = await salesService.update(rawId, {
          date: editDate,
          salePrice: amount,
          buyer: editParty.trim() || detail.party,
          ...(detail.kind === 'animalsale'
            ? { tagNumber: editTag.trim() || detail.tagNumber || '—' }
            : detail.kind === 'milksale'
              ? { tagNumber: MILK_SALE_TAG }
              : { tagNumber: null }),
          notes:
            detail.kind === 'milksale'
              ? milkSaleNotes(kg, editNotes)
              : editNotes.trim() || null,
        });
        setSales((prev) => prev.map((r) => (r.id === rawId ? updated : r)));
      } else if (detail.kind === 'purchase') {
        const tag = editTag.trim();
        if (!tag) {
          toast('Tag number is required', 'error');
          setSaving(false);
          return;
        }
        const updated = await goatPurchasesService.update(rawId, {
          date: editDate,
          tagNumber: tag,
          purchasePrice: amount,
          notes: editNotes.trim() || null,
        });
        setPurchases((prev) => prev.map((r) => (r.id === rawId ? updated : r)));
      } else if (detail.kind === 'cashout') {
        const partner = editParty.trim();
        if (!partner) {
          toast('Enter who received the cash', 'error');
          setSaving(false);
          return;
        }
        const updated = await expensesService.update(rawId, {
          date: editDate,
          amount,
          category: 'Partner Payout',
          description: `Cash out · ${partner}`,
          notes: editNotes.trim() || null,
        });
        setExpenses((prev) => prev.map((r) => (r.id === rawId ? updated : r)));
      } else {
        const note = editNotes.trim();
        const updated = await expensesService.update(rawId, {
          date: editDate,
          amount,
          category: editCategory,
          description: note || editCategory,
          notes: note || null,
        });
        setExpenses((prev) => prev.map((r) => (r.id === rawId ? updated : r)));
      }

      toast('Entry updated');
      setEditing(false);
      setDetail(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const canEditDetail = detail != null && canModifyRecord(detail.ownerId);

  return (
    <div>
      <PageHeader
        title="Cashbook"
        action={{ label: 'Add record', href: '/cashbook/new' }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Money In" value={formatCurrency(moneyIn)} />
        <StatCard label="Money Out" value={formatCurrency(moneyOut)} />
        <StatCard label="Wallet" value={formatCurrency(wallet)} />
        <StatCard
          label={profit >= 0 ? 'Profit' : 'Loss'}
          value={
            profit >= 0
              ? formatCurrency(profit)
              : `−${formatCurrency(Math.abs(profit))}`
          }
          valueClassName={profit >= 0 ? 'text-emerald-700' : 'text-red-700'}
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
            { label: 'Milk sale', value: 'milksale' },
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
            onRowClick={openDetail}
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
                      r.kind === 'sale' || r.kind === 'animalsale' || r.kind === 'milksale'
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
                  <span
                    className="block max-w-[12rem] truncate md:max-w-[16rem]"
                    title={r.description}
                  >
                    {r.description}
                  </span>
                ),
              },
              {
                key: 'party',
                header: 'Party',
                hideOnMobile: true,
                render: (r) => r.party,
              },
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
                hideOnMobile: true,
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
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        aria-label="Edit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-fg hover:bg-muted hover:text-fg"
                        onClick={() => {
                          openDetail(r);
                          startEdit(r);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null,
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={!!detail}
        onClose={closeDetail}
        title={
          detail
            ? editing
              ? `Edit ${KIND_LABEL[detail.kind]}`
              : KIND_LABEL[detail.kind]
            : 'Entry detail'
        }
        footer={
          detail && canEditDetail ? (
            editing ? (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="edit-cashbook-form"
                  className="w-full sm:w-auto"
                  loading={saving}
                  loadingText="Saving…"
                >
                  Save changes
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  aria-label="Edit"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-fg hover:bg-muted hover:text-fg"
                  onClick={() => startEdit(detail)}
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                  onClick={() => {
                    setDeleteTarget(detail);
                    setDetail(null);
                    setEditing(false);
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )
          ) : undefined
        }
      >
        {detail && editing ? (
          <form
            id="edit-cashbook-form"
            onSubmit={(e) => void onSaveEdit(e)}
            className="grid gap-4"
          >
            <Input
              label="Date"
              type="date"
              required
              value={editDate}
              disabled={saving}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Input
              label="Amount (Rs.)"
              type="number"
              required
              min={0}
              step="1"
              value={editAmount}
              disabled={saving}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            {detail.kind === 'sale' && (
              <Input
                label="Money from"
                required
                value={editParty}
                disabled={saving}
                onChange={(e) => setEditParty(e.target.value)}
              />
            )}
            {detail.kind === 'milksale' && (
              <>
                <Input
                  label="Sold to"
                  required
                  value={editParty}
                  disabled={saving}
                  onChange={(e) => setEditParty(e.target.value)}
                />
                <Input
                  label="Milk sold (kg)"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={editMilkKg}
                  disabled={saving}
                  onChange={(e) => setEditMilkKg(e.target.value)}
                />
              </>
            )}
            {detail.kind === 'animalsale' && (
              <Input
                label="Tag number"
                value={editTag}
                disabled={saving}
                onChange={(e) => setEditTag(e.target.value)}
              />
            )}
            {detail.kind === 'purchase' && (
              <Input
                label="Tag number"
                required
                value={editTag}
                disabled={saving}
                onChange={(e) => setEditTag(e.target.value)}
              />
            )}
            {detail.kind === 'cashout' && (
              <Input
                label="Given to"
                required
                value={editParty}
                disabled={saving}
                onChange={(e) => setEditParty(e.target.value)}
              />
            )}
            {detail.kind === 'expense' && (
              <Select
                label="Category"
                required
                value={editCategory}
                disabled={saving}
                onChange={(e) => setEditCategory(e.target.value)}
                options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
              />
            )}
            <Textarea
              label="Notes"
              rows={3}
              value={editNotes}
              disabled={saving}
              required={detail.kind === 'expense'}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </form>
        ) : detail ? (
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
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete cashbook entry?"
        description={
          deleteTarget
            ? `“${deleteTarget.description}” will be deleted.`
            : 'This record will be deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
