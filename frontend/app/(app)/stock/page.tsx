'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, PackageMinus, PackagePlus } from 'lucide-react';
import { inventoryService } from '@/services/dashboard';
import type { InventoryItem } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Badge,
  statusTone,
  Button,
  Card,
  StatCard,
  EmptyState,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/format';

function stockPercent(item: InventoryItem): number {
  if (item.minimumStock <= 0) return item.currentStock > 0 ? 100 : 0;
  // Show remaining relative to a comfortable buffer (2× minimum)
  const target = item.minimumStock * 2;
  return Math.min(100, Math.round((item.currentStock / target) * 100));
}

function barColor(item: InventoryItem): string {
  if (item.status === 'Out of Stock' || item.currentStock <= 0) return 'bg-danger';
  if (item.status === 'Low Stock' || item.currentStock < item.minimumStock) return 'bg-warning';
  return 'bg-success';
}

export default function StockPage() {
  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    void inventoryService.getAll().then(setRows);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((i) => {
      if (category && i.category !== category) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    });
  }, [rows, search, category]);

  const lowCount = rows.filter((i) => i.currentStock < i.minimumStock).length;
  const outCount = rows.filter((i) => i.currentStock <= 0).length;
  const feedItems = rows.filter((i) => i.category === 'Goat Feed');
  const feedLeft = feedItems.reduce((sum, i) => sum + i.currentStock, 0);

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Track how much feed and supplies are left on the farm."
      >
        <Link href="/inventory/stock-in">
          <Button>
            <PackagePlus className="h-4 w-4" />
            Stock In
          </Button>
        </Link>
        <Link href="/inventory/stock-out">
          <Button variant="outline">
            <PackageMinus className="h-4 w-4" />
            Stock Out
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Feed left" value={`${feedLeft} bags`} hint="Goat feed on hand" />
        <StatCard label="Total items" value={String(rows.length)} hint="Tracked stock items" />
        <StatCard label="Low stock" value={String(lowCount)} hint="Below minimum level" />
        <StatCard label="Out of stock" value={String(outCount)} hint="Needs restocking" />
      </div>

      {lowCount + outCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {outCount > 0 && (
              <span>
                <strong>{outCount}</strong> item{outCount === 1 ? '' : 's'} out of stock.{' '}
              </span>
            )}
            {lowCount > 0 && (
              <span>
                <strong>{lowCount}</strong> item{lowCount === 1 ? '' : 's'} below minimum.
              </span>
            )}{' '}
            Restock soon so feeding and treatments are not interrupted.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search feed, medicine…"
          className="sm:max-w-xs"
        />
        <Select
          options={['Goat Feed', 'Medicine', 'Vaccines', 'Equipment', 'Other Supplies'].map(
            (c) => ({ label: c, value: c })
          )}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-44"
        />
        <Button
          variant="ghost"
          size="sm"
          className="sm:ml-auto"
          onClick={() => setCategory('Goat Feed')}
        >
          Show feed only
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No stock items"
          description="Add inventory, then track remaining stock here."
          actionLabel="Stock In"
          actionHref="/inventory/stock-in"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const pct = stockPercent(item);
            const leftLabel =
              item.currentStock <= 0
                ? 'Nothing left'
                : item.currentStock < item.minimumStock
                  ? 'Running low'
                  : 'Enough left';

            return (
              <Card key={item.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-fg">{item.category}</p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight">
                        {item.currentStock}{' '}
                        <span className="text-sm font-medium text-muted-fg">{item.unit}</span>
                      </p>
                      <p className="text-xs text-muted-fg">{leftLabel}</p>
                    </div>
                    <p className="text-xs text-muted-fg">
                      Min {item.minimumStock} {item.unit}
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', barColor(item))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-fg">
                  <span>Unit cost {formatCurrency(item.cost)}</span>
                  {item.supplier && <span className="truncate">{item.supplier}</span>}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                  <Link href={`/inventory/${item.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Link href="/inventory/stock-in">
                    <Button size="sm" variant="secondary">
                      + In
                    </Button>
                  </Link>
                  <Link href="/inventory/stock-out">
                    <Button size="sm" variant="ghost">
                      − Out
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
