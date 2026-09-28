'use client';

import { useEffect, useMemo, useState } from 'react';
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
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

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

  const sorted = useMemo(() => {
    return [...txns].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      if (bTime !== aTime) return bTime - aTime;
      // Same instant: stock out after stock in for same day feels wrong; keep createdAt id tiebreak
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [txns]);

  const totalSpent = useMemo(
    () =>
      sorted
        .filter((t) => t.direction === 'in' && t.cost != null)
        .reduce((s, t) => s + (t.cost ?? 0), 0),
    [sorted]
  );

  const { page, setPage, paged, pageSize, total } = usePagedList(sorted, sorted.length);

  if (loading) return <LoadingState label="Loading item…" />;
  if (!item) return <p className="text-sm text-muted-fg">Item not found.</p>;

  return (
    <div>
      <PageHeader title={item.name} description={item.category}>
        <Link href={`/inventory/stock-in?item=${item.id}`}>
          <Button>Stock In</Button>
        </Link>
        <Link href={`/inventory/stock-out?item=${item.id}`}>
          <Button variant="outline">Stock Out</Button>
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
            <dt className="text-muted-fg">Status</dt>
            <dd>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Total spent</dt>
            <dd className="font-semibold">{formatCurrency(totalSpent)}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Added by</dt>
            <dd>
              <OwnerBadge name={item.ownerName} isOwn={isOwnerOf(item.ownerId)} />
            </dd>
          </div>
          {item.notes && (
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="text-muted-fg">Notes</dt>
              <dd>{item.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Stock movements</h2>
      <p className="mb-3 text-sm text-muted-fg">
        Stock in and stock out. Purchases also post to the cashbook as expenses.
      </p>
      <Table
        data={paged}
        rowKey={(t) => t.id}
        empty={
          <EmptyState
            title="No movements yet"
            description="Use Stock In or Stock Out to record quantity changes."
          />
        }
        columns={[
          { key: 'date', header: 'Date', render: (t) => formatDateTime(t.createdAt || t.date) },
          {
            key: 'type',
            header: 'Type',
            render: (t) => (
              <Badge tone={t.direction === 'in' ? 'success' : 'warning'}>
                {t.direction === 'in' ? 'Stock in' : 'Stock out'}
              </Badge>
            ),
          },
          {
            key: 'qty',
            header: 'Quantity',
            render: (t) => (
              <span className={t.direction === 'out' ? 'text-red-700' : 'text-emerald-700'}>
                {t.direction === 'in' ? '+' : '−'}
                {t.quantity} {item.unit}
              </span>
            ),
          },
          {
            key: 'cost',
            header: 'Total paid',
            render: (t) =>
              t.direction === 'in' && t.cost != null ? formatCurrency(t.cost) : '—',
          },
          {
            key: 'notes',
            header: 'Notes',
            className: 'max-w-[12rem] truncate',
            render: (t) => t.notes?.trim() || '—',
          },
          {
            key: 'owner',
            header: 'By',
            render: (t) => <OwnerBadge name={t.ownerName} isOwn={isOwnerOf(t.ownerId)} />,
          },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
