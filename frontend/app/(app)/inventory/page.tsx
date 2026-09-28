'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageMinus, PackagePlus } from 'lucide-react';
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
  LoadingState,
  Pagination,
} from '@/components/ui';
import { usePagedList } from '@/lib/usePagedList';

export default function InventoryPage() {
  const router = useRouter();
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

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${category}`
  );

  const inStock = rows.filter((i) => i.currentStock > 0).length;
  const outCount = rows.filter((i) => i.currentStock <= 0).length;

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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total items" value={String(rows.length)} />
        <StatCard label="In stock" value={String(inStock)} />
        <StatCard label="Out of stock" value={String(outCount)} />
      </div>

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

      {loading ? (
        <LoadingState label="Loading inventory…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(i) => i.id}
            onRowClick={(i) => router.push(`/inventory/${i.id}`)}
            empty={
              <EmptyState
                title="No inventory items"
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
                key: 'status',
                header: 'Status',
                render: (i) => <Badge tone={statusTone(i.status)}>{i.status}</Badge>,
              },
              {
                key: 'owner',
                header: 'Added by',
                render: (i) => <OwnerBadge name={i.ownerName} isOwn={isOwnerOf(i.ownerId)} />,
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (i) =>
                  canModifyRecord(i.ownerId) ? (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(i.id)}>
                      Delete
                    </Button>
                  ) : null,
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

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
