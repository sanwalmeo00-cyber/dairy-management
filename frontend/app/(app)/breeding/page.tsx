'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { breedingService } from '@/services/breeding';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Breeding } from '@/types/farm';
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
} from '@/components/ui';
import { formatDate } from '@/lib/format';

function goatName(id: string) {
  return mockGoats.find((g) => g.id === id)?.name ?? id;
}

export default function BreedingPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Breeding[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void breedingService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'breeding'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((b) => {
      if (status && b.status !== status) return false;
      if (!q) return true;
      const hay = `${goatName(b.femaleGoatId)} ${goatName(b.maleGoatId)} ${b.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeRows, search, status]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const record = rows.find((b) => b.id === deleteId);
    if (!record || !canModifyRecord(record.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'breeding',
      recordId: record.id,
      label: `${goatName(record.femaleGoatId)} × ${goatName(record.maleGoatId)}`,
      ownerId: record.ownerId,
      ownerName: record.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((b) => b.id === deleteId);

  return (
    <div>
      <PageHeader title="Breeding" description="Track mating, pregnancy, and kidding." action={{ label: 'Plan Breeding', href: '/breeding/new' }} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search goats or status…" className="sm:max-w-xs" />
        <Select
          options={['Planned', 'Completed', 'Pregnant', 'Failed'].map((s) => ({ label: s, value: s }))}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(b) => b.id}
        empty={<EmptyState title="No breeding records" description="Plan a new breeding to get started." />}
        columns={[
          { key: 'female', header: 'Female', render: (b) => goatName(b.femaleGoatId) },
          { key: 'male', header: 'Male', render: (b) => goatName(b.maleGoatId) },
          { key: 'date', header: 'Breeding Date', render: (b) => formatDate(b.breedingDate) },
          { key: 'due', header: 'Expected Due', render: (b) => formatDate(b.expectedDueDate) },
          {
            key: 'status',
            header: 'Status',
            render: (b) => <Badge tone={statusTone(b.status)}>{b.status}</Badge>,
          },
          {
            key: 'owner',
            header: 'Owner',
            render: (b) => <OwnerBadge name={b.ownerName} isOwn={isOwnerOf(b.ownerId)} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (b) => (
              <div className="flex justify-end gap-1">
                <Link href={`/breeding/${b.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                {canModifyRecord(b.ownerId) && (
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(b.id)}>
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
        onConfirm={confirmDelete}
        title="Delete breeding record?"
        description={
          pending
            ? `“${goatName(pending.femaleGoatId)} × ${goatName(pending.maleGoatId)}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
