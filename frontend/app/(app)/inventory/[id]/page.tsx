'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { inventoryService } from '@/services/inventory';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { InventoryItem, InventoryTransaction } from '@/types/farm';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  Table,
  OwnerBadge,
  LoadingState,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [txns, setTxns] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setItem((await inventoryService.getById(id)) ?? null);
        setTxns(await inventoryService.getTransactions(id));
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load item', 'error');
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) return <LoadingState label="Loading item…" />;
  if (!item) return <p className="text-sm text-muted-fg">Item not found.</p>;

  return (
    <div>
      <PageHeader title={item.name} description={item.category}>
        <OwnerBadge name={item.ownerName} isOwn={isOwnerOf(item.ownerId)} />
        <Link href="/inventory/stock-in">
          <Button variant="outline">Stock In</Button>
        </Link>
        <Link href="/inventory/stock-out">
          <Button variant="outline">Stock Out</Button>
        </Link>
        <Link href="/inventory">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>

      <Card className="mb-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-fg">Current stock</dt>
            <dd className="font-medium">
              {item.currentStock} {item.unit}
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Minimum</dt>
            <dd>
              {item.minimumStock} {item.unit}
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Days left</dt>
            <dd>
              {item.daysLeft != null
                ? `~${item.daysLeft} days`
                : item.dailyUsage
                  ? '—'
                  : 'Set daily usage'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Status</dt>
            <dd>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Unit cost</dt>
            <dd>{formatCurrency(item.cost)}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Daily usage</dt>
            <dd>
              {item.dailyUsage != null ? `${item.dailyUsage} ${item.unit}/day` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Expiry</dt>
            <dd className="flex flex-wrap items-center gap-2">
              {item.expiryDate ? formatDate(item.expiryDate) : '—'}
              {item.expiryStatus && item.expiryStatus !== 'Ok' && (
                <Badge tone={statusTone(item.expiryStatus)}>{item.expiryStatus}</Badge>
              )}
            </dd>
          </div>
          {item.supplier && (
            <div>
              <dt className="text-muted-fg">Supplier</dt>
              <dd>{item.supplier}</dd>
            </div>
          )}
          {item.notes && (
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="text-muted-fg">Notes</dt>
              <dd>{item.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
      <Table
        data={txns}
        rowKey={(t) => t.id}
        empty={<p className="text-sm text-muted-fg">No stock movements yet.</p>}
        columns={[
          { key: 'date', header: 'Date', render: (t) => formatDate(t.date) },
          {
            key: 'dir',
            header: 'Direction',
            render: (t) => (t.direction === 'in' ? 'Stock In' : 'Stock Out'),
          },
          { key: 'qty', header: 'Quantity', render: (t) => t.quantity },
          { key: 'reason', header: 'Reason', render: (t) => t.reason ?? '—' },
          {
            key: 'cost',
            header: 'Cost',
            render: (t) => (t.cost != null ? formatCurrency(t.cost) : '—'),
          },
          {
            key: 'owner',
            header: 'By',
            render: (t) => <OwnerBadge name={t.ownerName} isOwn={isOwnerOf(t.ownerId)} />,
          },
        ]}
      />
    </div>
  );
}
