'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { goatPurchasesService } from '@/services/finance';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
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

function goatName(id: string) {
  return mockGoats.find((g) => g.id === id)?.name ?? id;
}

export default function GoatPurchasesPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<GoatPurchase[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void goatPurchasesService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'goat-purchase'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((r) => {
      if (!q) return true;
      return (
        goatName(r.goatId).toLowerCase().includes(q) ||
        r.seller.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [activeRows, search]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const record = rows.find((r) => r.id === deleteId);
    if (!record || !canModifyRecord(record.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'goat-purchase',
      recordId: record.id,
      label: `Purchase: ${goatName(record.goatId)} from ${record.seller}`,
      ownerId: record.ownerId,
      ownerName: record.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader title="Goat Purchases" description="Goats acquired from external sellers." action={{ label: 'Record Purchase', href: '/goat-purchases/new' }} />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search goat, seller…" className="sm:max-w-xs" />
      </div>
      <Table
        data={filtered}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No goat purchases" description="Record a purchase to track acquisition costs." />}
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'goat', header: 'Goat', render: (r) => goatName(r.goatId) },
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
                <Link href={`/goats/${r.goatId}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                {canModifyRecord(r.ownerId) && (
                  <>
                    <Link href="/goat-purchases/new">
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
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete goat purchase?"
        description={
          pending
            ? `Purchase of “${goatName(pending.goatId)}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
