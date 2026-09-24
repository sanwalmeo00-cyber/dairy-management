'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, PackageMinus, PackagePlus } from 'lucide-react';
import { inventoryService } from '@/services/inventory';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { InventoryItem } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Badge,
  statusTone,
  Button,
  OwnerBadge,
  EmptyState,
  StatCard,
  ConfirmDialog,
} from '@/components/ui';
import { formatDate } from '@/lib/format';

export default function InventoryPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await inventoryService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load inventory', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((i) => {
      if (category && i.category !== category) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    });
  }, [rows, search, category]);

  const lowCount = rows.filter((i) => i.currentStock > 0 && i.currentStock < i.minimumStock).length;
  const outCount = rows.filter((i) => i.currentStock <= 0).length;
  const expiringCount = rows.filter(
    (i) => i.expiryStatus === 'Expired' || i.expiryStatus === 'Expiring soon'
  ).length;

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await inventoryService.remove(deleteId);
      toast('Item deleted');
      setDeleteId(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Inventory" description="Feed, medicine, vaccines, and supplies on hand.">
        <Link href="/inventory/new">
          <Button>Add Item</Button>
        </Link>
        <Link href="/inventory/stock-in">
          <Button variant="outline">
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
        <StatCard label="Total items" value={String(rows.length)} hint="Tracked inventory" />
        <StatCard label="Low stock" value={String(lowCount)} hint="Below minimum level" />
        <StatCard label="Out of stock" value={String(outCount)} hint="Needs restocking" />
        <StatCard label="Expiry alerts" value={String(expiringCount)} hint="Expired or soon" />
      </div>

      {lowCount + outCount + expiringCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {outCount > 0 && (
              <span>
                <strong>{outCount}</strong> out of stock.{' '}
              </span>
            )}
            {lowCount > 0 && (
              <span>
                <strong>{lowCount}</strong> low stock.{' '}
              </span>
            )}
            {expiringCount > 0 && (
              <span>
                <strong>{expiringCount}</strong> expired or expiring soon.
              </span>
            )}
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search items…" className="sm:max-w-xs" />
        <Select
          options={['Goat Feed', 'Medicine', 'Vaccines', 'Equipment', 'Other Supplies'].map((c) => ({
            label: c,
            value: c,
          }))}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-44"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(i) => i.id}
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No inventory items'}
            description="Add feed, medicine, or supplies to track stock."
            actionLabel="Add Item"
            actionHref="/inventory/new"
          />
        }
        columns={[
          { key: 'name', header: 'Item', render: (i) => i.name },
          { key: 'cat', header: 'Category', render: (i) => i.category },
          {
            key: 'stock',
            header: 'Stock',
            render: (i) => `${i.currentStock} ${i.unit}`,
          },
          {
            key: 'days',
            header: 'Days left',
            render: (i) => (i.daysLeft != null ? `~${i.daysLeft}` : '—'),
          },
          {
            key: 'expiry',
            header: 'Expiry',
            render: (i) =>
              i.expiryDate ? (
                <span className="inline-flex flex-col gap-0.5">
                  <span>{formatDate(i.expiryDate)}</span>
                  {i.expiryStatus && i.expiryStatus !== 'Ok' && (
                    <Badge tone={statusTone(i.expiryStatus)}>{i.expiryStatus}</Badge>
                  )}
                </span>
              ) : (
                '—'
              ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (i) => <Badge tone={statusTone(i.status)}>{i.status}</Badge>,
          },
          {
            key: 'owner',
            header: 'Owner',
            render: (i) => <OwnerBadge name={i.ownerName} isOwn={isOwnerOf(i.ownerId)} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (i) => (
              <div className="flex justify-end gap-1">
                <Link href={`/inventory/${i.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                {canModifyRecord(i.ownerId) && (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(i.id)}>
                    Delete
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete inventory item?"
        description="This soft-deletes the item. Stock history remains in deleted records."
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
