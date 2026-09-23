'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { kidsService } from '@/services/kids';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Kid } from '@/types/farm';
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

export default function KidsPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Kid[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void kidsService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'kid'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((k) => {
      if (status && k.status !== status) return false;
      if (!q) return true;
      return (
        k.name.toLowerCase().includes(q) ||
        k.tagNumber.toLowerCase().includes(q) ||
        goatName(k.motherId).toLowerCase().includes(q)
      );
    });
  }, [activeRows, search, status]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const kid = rows.find((k) => k.id === deleteId);
    if (!kid || !canModifyRecord(kid.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'kid',
      recordId: kid.id,
      label: `${kid.name} (${kid.tagNumber})`,
      ownerId: kid.ownerId,
      ownerName: kid.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((k) => k.id === deleteId);

  return (
    <div>
      <PageHeader title="Kids" description="Young goats from your breeding program." action={{ label: 'Register Kid', href: '/kids/new' }} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, tag, mother…" className="sm:max-w-xs" />
        <Select
          options={['Active', 'Sold', 'Deceased'].map((s) => ({ label: s, value: s }))}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-40"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(k) => k.id}
        empty={<EmptyState title="No kids found" description="Register a kid or adjust filters." />}
        columns={[
          { key: 'tag', header: 'Tag', render: (k) => k.tagNumber },
          { key: 'name', header: 'Name', render: (k) => k.name },
          { key: 'gender', header: 'Gender', render: (k) => k.gender },
          { key: 'dob', header: 'DOB', render: (k) => formatDate(k.dateOfBirth) },
          { key: 'mother', header: 'Mother', render: (k) => goatName(k.motherId) },
          {
            key: 'status',
            header: 'Status',
            render: (k) => <Badge tone={statusTone(k.status)}>{k.status}</Badge>,
          },
          {
            key: 'owner',
            header: 'Owner',
            render: (k) => <OwnerBadge name={k.ownerName} isOwn={isOwnerOf(k.ownerId)} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (k) => (
              <div className="flex justify-end gap-1">
                <Link href={`/kids/${k.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                {canModifyRecord(k.ownerId) && (
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(k.id)}>
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
        title="Delete kid?"
        description={
          pending
            ? `“${pending.name}” will be marked as deleted (not removed from the database). You can find it later in the Deleted tab.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Mark deleted"
      />
    </div>
  );
}
