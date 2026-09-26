'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { purchasesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Purchase } from '@/types/farm';
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
  ConfirmDialog,
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

export default function PurchasesPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await purchasesService.getAll());
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load purchases', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const activeRows = useMemo(() => filterActive(rows, 'purchase'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((r) => {
      if (category && r.category !== category) return false;
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [activeRows, search, category]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${category}`
  );

  const confirmDelete = () => {
    if (!deleteId) return;
    const purchase = rows.find((r) => r.id === deleteId);
    if (!purchase || !canModifyRecord(purchase.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'purchase',
      recordId: purchase.id,
      label: purchase.description,
      ownerId: purchase.ownerId,
      ownerName: purchase.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Farm supplies and operational purchases."
        action={{ label: 'Add Purchase', href: '/purchases/new' }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search description, vendor…"
          className="sm:max-w-xs"
        />
        <Select
          options={['Feed', 'Medicine', 'Equipment', 'Transportation', 'Supplies', 'Other'].map(
            (c) => ({
              label: c,
              value: c,
            })
          )}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-44"
        />
      </div>
      {loading ? (
        <LoadingState label="Loading purchases…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(r) => r.id}
            empty={<EmptyState title="No purchases" description="Add a purchase record." />}
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'desc', header: 'Description', render: (r) => r.description },
              { key: 'cat', header: 'Category', render: (r) => r.category },
              { key: 'vendor', header: 'Vendor', render: (r) => r.vendor },
              { key: 'total', header: 'Total', render: (r) => formatCurrency(r.totalAmount) },
              {
                key: 'payment',
                header: 'Payment',
                render: (r) => <Badge tone={statusTone(r.paymentStatus)}>{r.paymentStatus}</Badge>,
              },
              {
                key: 'owner',
                header: 'Owner',
                render: (r) => <OwnerBadge name={r.ownerName} isOwn={isOwnerOf(r.ownerId)} />,
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast(`Purchase: ${r.description} (mock view)`)}
                    >
                      View
                    </Button>
                    {canModifyRecord(r.ownerId) && (
                      <>
                        <Link href="/purchases/new">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete purchase?"
        description={
          pending
            ? `“${pending.description}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
