'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { workersService, workerPaymentsService } from '@/services/workers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Worker, WorkerMonthSummary, WorkerPayment, WorkerPaymentType, PaymentMethod } from '@/types/farm';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  Table,
  OwnerBadge,
  Input,
  Select,
  Textarea,
  EmptyState,
  LoadingState,
  Skeleton,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOwnerOf, canModifyRecord } = useAuth();
  const { toast } = useToast();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [summary, setSummary] = useState<WorkerMonthSummary | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (showPageLoading = false) => {
    if (showPageLoading) setLoading(true);
    try {
      const w = await workersService.getById(id);
      setWorker(w ?? null);
      if (!w) return;
      setPayments(await workersService.getPayments(id));
      setSummary(await workersService.getMonthSummary(id, month));
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

  useEffect(() => {
    if (!worker) return;
    void (async () => {
      try {
        setSummary(await workersService.getMonthSummary(id, month));
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load summary', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const monthPayments = useMemo(
    () => payments.filter((p) => p.forMonth === month),
    [payments, month]
  );

  const onRecordPayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!worker || !canModifyRecord(worker.ownerId) || saving) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await workerPaymentsService.create({
        workerId: worker.id,
        date: String(fd.get('date')),
        forMonth: String(fd.get('forMonth')),
        type: String(fd.get('type')) as WorkerPaymentType,
        amount: Number(fd.get('amount')),
        paymentMethod: String(fd.get('paymentMethod')),
        notes: String(fd.get('notes') ?? '') || null,
      });
      toast('Payment recorded');
      e.currentTarget.reset();
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
        <Link href="/workers">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Details</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
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
            <div>
              <dt className="text-muted-fg">Owner</dt>
              <dd>
                <OwnerBadge name={worker.ownerName} isOwn={isOwnerOf(worker.ownerId)} />
              </dd>
            </div>
          </dl>
          {worker.notes && <p className="mt-3 text-sm text-muted-fg">{worker.notes}</p>}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Month summary</h2>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-40"
            />
          </div>
          {summary ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-fg">Monthly salary</dt>
                <dd>{formatCurrency(summary.monthlySalary)}</dd>
              </div>
              <div>
                <dt className="text-muted-fg">Advances</dt>
                <dd>{formatCurrency(summary.advances)}</dd>
              </div>
              <div>
                <dt className="text-muted-fg">Salary paid</dt>
                <dd>{formatCurrency(summary.salaryPaid)}</dd>
              </div>
              <div>
                <dt className="text-muted-fg">Balance due</dt>
                <dd className="font-semibold">{formatCurrency(summary.balanceDue)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-fg">Loading summary…</p>
          )}
        </Card>
      </div>

      {canEdit && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold">Record payment</h2>
          <form onSubmit={(e) => void onRecordPayment(e)} className="grid gap-4 sm:grid-cols-2">
            <Input name="date" label="Date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            <Input name="forMonth" label="For month" type="month" required defaultValue={month} />
            <Select
              name="type"
              label="Type"
              required
              options={(['Salary', 'Advance', 'Bonus', 'Other'] as WorkerPaymentType[]).map((t) => ({
                label: t,
                value: t,
              }))}
            />
            <Input name="amount" label="Amount (Rs.)" type="number" required />
            <Select
              name="paymentMethod"
              label="Payment method"
              required
              options={(
                ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other'] as PaymentMethod[]
              ).map((m) => ({ label: m, value: m }))}
            />
            <div className="sm:col-span-2">
              <Textarea name="notes" label="Notes" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving} loadingText="Saving…">
                Save payment
              </Button>
            </div>
          </form>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-semibold">Payments for {month}</h2>
      <Table
        data={monthPayments}
        rowKey={(p) => p.id}
        empty={<EmptyState title="No payments this month" description="Record salary or an advance above." />}
        columns={[
          { key: 'date', header: 'Date', render: (p) => formatDate(p.date) },
          { key: 'type', header: 'Type', render: (p) => p.type },
          { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
          { key: 'method', header: 'Method', render: (p) => p.paymentMethod },
          {
            key: 'owner',
            header: 'Owner',
            render: (p) => <OwnerBadge name={p.ownerName} isOwn={isOwnerOf(p.ownerId)} />,
          },
        ]}
      />
    </div>
  );
}
