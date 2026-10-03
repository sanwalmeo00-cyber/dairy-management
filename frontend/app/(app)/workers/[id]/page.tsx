'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { workersService, workerPaymentsService } from '@/services/workers';
import { walletService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Worker, WorkerPayment } from '@/types/farm';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  Table,
  OwnerBadge,
  Input,
  Textarea,
  EmptyState,
  LoadingState,
  Skeleton,
  Modal,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Inclusive calendar months from joining month through the current month. */
function monthsEmployed(joiningDate: string): number {
  const start = new Date(`${joiningDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  if (start > now) return 0;
  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1
  );
}

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOwnerOf, canModifyRecord } = useAuth();
  const { toast } = useToast();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [giveOpen, setGiveOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const load = async (showPageLoading = false) => {
    if (showPageLoading) setLoading(true);
    try {
      const w = await workersService.getById(id);
      setWorker(w ?? null);
      if (!w) return;
      const [pays, balance] = await Promise.all([
        workersService.getPayments(id),
        walletService.getBalance().catch(() => null),
      ]);
      setPayments(pays);
      if (balance != null) setWalletBalance(balance);
    } finally {
      if (showPageLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void load(true).catch((err) => {
      toast(err instanceof Error ? err.message : 'Failed to load worker', 'error');
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const moneySummary = useMemo(() => {
    if (!worker) return null;
    const totalGiven = payments.reduce((s, p) => s + p.amount, 0);
    const months = monthsEmployed(worker.joiningDate);
    const salaryEarned = worker.salary * months;
    const net = totalGiven - salaryEarned;
    return { totalGiven, months, salaryEarned, net };
  }, [worker, payments]);

  const { page, setPage, paged, pageSize, total } = usePagedList(payments, payments.length);

  const onRecordPayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!worker || !canModifyRecord(worker.ownerId) || saving) return;
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get('amount'));
    if (!(amount > 0)) {
      toast('Enter a valid amount', 'error');
      return;
    }
    if (walletBalance != null && walletBalance < amount) {
      toast(
        `Not enough money in wallet. Wallet has ${formatCurrency(walletBalance)}, need ${formatCurrency(amount)}.`,
        'error'
      );
      return;
    }
    const date = String(fd.get('date'));
    const forMonth = date.slice(0, 7) || currentMonth();
    setSaving(true);
    try {
      await workerPaymentsService.create({
        workerId: worker.id,
        date,
        forMonth,
        type: 'Other',
        amount,
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast(`Payment recorded — Rs. ${amount.toLocaleString()} taken from wallet`);
      setGiveOpen(false);
      await load(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <LoadingState label="Loading worker…" />
      </div>
    );
  }

  if (!worker) return <p className="text-sm text-muted-fg">Worker not found.</p>;

  const canEdit = canModifyRecord(worker.ownerId);

  return (
    <div>
      <PageHeader title={worker.name} description={worker.role}>
        {canEdit && (
          <Button onClick={() => setGiveOpen(true)}>Add record</Button>
        )}
      </PageHeader>

      <Card className="mb-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-fg">Phone</dt>
            <dd>{worker.phone}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Monthly salary</dt>
            <dd>{formatCurrency(worker.salary)}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Joined</dt>
            <dd>{formatDate(worker.joiningDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Status</dt>
            <dd>
              <Badge tone={statusTone(worker.status)}>{worker.status}</Badge>
            </dd>
          </div>
          {moneySummary && (
            <>
              <div>
                <dt className="text-muted-fg">Total given</dt>
                <dd className="font-semibold">{formatCurrency(moneySummary.totalGiven)}</dd>
              </div>
              <div>
                <dt className="text-muted-fg">Salary earned</dt>
                <dd>
                  {formatCurrency(moneySummary.salaryEarned)}
                  <span className="ml-1 text-muted-fg">({moneySummary.months} mo)</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-fg">
                  {moneySummary.net >= 0 ? 'Extra paid' : 'Balance due'}
                </dt>
                <dd
                  className={
                    moneySummary.net >= 0
                      ? 'font-semibold text-emerald-700'
                      : 'font-semibold text-red-700'
                  }
                >
                  {formatCurrency(Math.abs(moneySummary.net))}
                </dd>
              </div>
            </>
          )}
        </dl>
        {worker.notes && <p className="mt-3 text-sm text-muted-fg">{worker.notes}</p>}
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Money given</h2>
      <Table
        data={paged}
        rowKey={(p) => p.id}
        empty={
          <EmptyState
            title="No money given yet"
            description="Tap Add record to add a payment."
          />
        }
        columns={[
          { key: 'date', header: 'Date', render: (p) => formatDate(p.date) },
          { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
          {
            key: 'notes',
            header: 'Notes',
            className: 'max-w-[14rem] truncate',
            render: (p) => p.notes?.trim() || '—',
          },
          {
            key: 'owner',
            header: 'Recorded by',
            render: (p) => <OwnerBadge name={p.ownerName} isOwn={isOwnerOf(p.ownerId)} />,
          },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal
        open={giveOpen}
        onClose={() => !saving && setGiveOpen(false)}
        title={walletBalance != null && walletBalance <= 0 ? 'Wallet empty' : 'Give money'}
        footer={
          walletBalance != null && walletBalance <= 0 ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setGiveOpen(false)}
              >
                Close
              </Button>
              <Link href="/cashbook/new?type=sale" className="w-full sm:w-auto">
                <Button type="button" className="w-full">
                  Go to Cashbook
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={saving}
                onClick={() => setGiveOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="give-money-form"
                className="w-full sm:w-auto"
                loading={saving}
                loadingText="Saving…"
              >
                Save
              </Button>
            </div>
          )
        }
      >
        {walletBalance != null && walletBalance <= 0 ? (
          <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            Wallet is empty. Add Money in on the cashbook first.
          </p>
        ) : (
          <>
            {walletBalance != null && (
              <p className="mb-4 text-sm text-muted-fg">
                Wallet: <strong className="text-fg">{formatCurrency(walletBalance)}</strong>
              </p>
            )}
            <form
              id="give-money-form"
              onSubmit={(e) => void onRecordPayment(e)}
              className="grid gap-4"
            >
              <Input
                name="date"
                label="Date"
                type="date"
                required
                disabled={saving}
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
              <Input
                name="amount"
                label="Amount (Rs.)"
                type="number"
                required
                min={1}
                step="1"
                disabled={saving}
              />
              <Textarea name="notes" label="Notes" rows={2} disabled={saving} />
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
