'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { workersService } from '@/services/dashboard';
import { useAuth } from '@/context/AuthContext';
import type { Worker, WorkerPayment } from '@/types/farm';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  Table,
  OwnerBadge,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOwnerOf, canModifyRecord } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);

  useEffect(() => {
    void (async () => {
      const w = await workersService.getById(id);
      setWorker(w ?? null);
      setPayments(await workersService.getPayments(id));
    })();
  }, [id]);

  if (!worker) return <p className="text-sm text-muted-fg">Worker not found.</p>;

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
              <dt className="text-muted-fg">Salary</dt>
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
          </dl>
          {worker.notes && <p className="mt-3 text-sm text-muted-fg">{worker.notes}</p>}
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Payment History</h2>
      <Table
        data={payments}
        rowKey={(p) => p.id}
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
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (p) =>
              canModifyRecord(p.ownerId) ? (
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
