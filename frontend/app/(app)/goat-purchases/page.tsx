'use client';

import { useEffect, useMemo, useState } from 'react';
import { goatPurchasesService } from '@/services/finance';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { GoatPurchase } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Table,
  Badge,
  statusTone,
  Button,
  OwnerBadge,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function GoatPurchasesPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<GoatPurchase[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await goatPurchasesService.getAll());
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load animal purchases', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (!q) return true;
      return (
        r.tagNumber.toLowerCase().includes(q) ||
        r.seller.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const record = rows.find((r) => r.id === deleteId);
    if (!record || !canModifyRecord(record.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await goatPurchasesService.remove(record.id);
      setRows((prev) => prev.filter((r) => r.id !== record.id));
      toast('Animal purchase deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Animal Purchases"
        description="Animals acquired from external sellers."
        action={{ label: 'Record Purchase', href: '/goat-purchases/new' }}
      />
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tag, seller…"
          className="sm:max-w-xs"
        />
      </div>
      <Table
        data={filtered}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No animal purchases'}
            description={
              loading ? 'Fetching from the server.' : 'Record a purchase to track acquisition costs.'
            }
          />
        }
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'tag', header: 'Tag No', render: (r) => r.tagNumber },
          { key: 'seller', header: 'Seller', render: (r) => r.seller },
          { key: 'price', header: 'Price', render: (r) => formatCurrency(r.purchasePrice) },
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
                {canModifyRecord(r.ownerId) && (
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(r.id)}>
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
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete animal purchase?"
        description={
          pending
            ? `Purchase of tag “${pending.tagNumber}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
