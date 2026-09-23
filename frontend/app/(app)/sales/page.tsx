'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { salesService } from '@/services/finance';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Sale } from '@/types/farm';
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

export default function SalesPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void salesService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'sale'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((r) => {
      if (!q) return true;
      return (
        goatName(r.goatId).toLowerCase().includes(q) ||
        r.buyer.toLowerCase().includes(q) ||
        r.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [activeRows, search]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const sale = rows.find((r) => r.id === deleteId);
    if (!sale || !canModifyRecord(sale.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'sale',
      recordId: sale.id,
      label: `Sale: ${goatName(sale.goatId)} to ${sale.buyer}`,
      ownerId: sale.ownerId,
      ownerName: sale.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((r) => r.id === deleteId);

  return (
    <div>
      <PageHeader title="Sales" description="Goat sales and buyer records." action={{ label: 'Record Sale', href: '/sales/new' }} />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search goat, buyer…" className="sm:max-w-xs" />
      </div>
      <Table
        data={filtered}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No sales" description="Record a sale when you sell a goat." />}
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'goat', header: 'Goat', render: (r) => goatName(r.goatId) },
          { key: 'buyer', header: 'Buyer', render: (r) => r.buyer },
          { key: 'price', header: 'Sale Price', render: (r) => formatCurrency(r.salePrice) },
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
                    <Link href="/sales/new">
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
        title="Delete sale?"
        description={
          pending
            ? `Sale of “${goatName(pending.goatId)}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
