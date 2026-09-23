'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { inventoryService } from '@/services/dashboard';
import type { InventoryItem, InventoryTransaction } from '@/types/farm';
import { PageHeader, Card, Badge, statusTone, Button, Table } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [txns, setTxns] = useState<InventoryTransaction[]>([]);

  useEffect(() => {
    void (async () => {
      setItem((await inventoryService.getById(id)) ?? null);
      setTxns(await inventoryService.getTransactions(id));
    })();
  }, [id]);

  if (!item) return <p className="text-sm text-muted-fg">Item not found.</p>;

  return (
    <div>
      <PageHeader title={item.name} description={item.category}>
        <Link href="/inventory/stock-in">
          <Button variant="outline">Stock In</Button>
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
            <dt className="text-muted-fg">Unit cost</dt>
            <dd>{formatCurrency(item.cost)}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Status</dt>
            <dd>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </dd>
          </div>
          {item.supplier && (
            <div className="sm:col-span-2">
              <dt className="text-muted-fg">Supplier</dt>
              <dd>{item.supplier}</dd>
            </div>
          )}
        </dl>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
      <Table
        data={txns}
        rowKey={(t) => t.id}
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
        ]}
      />
    </div>
  );
}
