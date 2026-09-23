'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { useSoftDelete } from '@/context/SoftDeleteContext';
import { useToast } from '@/context/ToastContext';
import type { Goat } from '@/types/farm';
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
import { formatCurrency, formatDate } from '@/lib/format';

export default function GoatsPage() {
  const { canModifyRecord, isOwnerOf, currentUser } = useAuth();
  const { softDelete, filterActive } = useSoftDelete();
  const { toast } = useToast();
  const [rows, setRows] = useState<Goat[]>([]);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void goatsService.getAll().then(setRows);
  }, []);

  const activeRows = useMemo(() => filterActive(rows, 'goat'), [rows, filterActive]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeRows.filter((g) => {
      if (gender && g.gender !== gender) return false;
      if (status && g.status !== status) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.tagNumber.toLowerCase().includes(q) ||
        g.breed.toLowerCase().includes(q)
      );
    });
  }, [activeRows, search, gender, status]);

  const confirmDelete = () => {
    if (!deleteId) return;
    const goat = rows.find((g) => g.id === deleteId);
    if (!goat || !canModifyRecord(goat.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    softDelete({
      entity: 'goat',
      recordId: goat.id,
      label: `${goat.name} (${goat.tagNumber})`,
      ownerId: goat.ownerId,
      ownerName: goat.ownerName,
      deletedBy: currentUser,
    });
    toast('Marked as deleted — find it in Deleted tab');
    setDeleteId(null);
  };

  const pending = rows.find((g) => g.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Goats"
        description="Manage your herd — tags, health, and ownership."
        action={{ label: 'Add Goat', href: '/goats/new' }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, tag, breed…"
          className="sm:max-w-xs"
        />
        <Select
          options={[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
          ]}
          placeholder="All genders"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="sm:w-40"
        />
        <Select
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Sold', value: 'Sold' },
            { label: 'Deceased', value: 'Deceased' },
          ]}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-40"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(g) => g.id}
        empty={
          <EmptyState
            title="No goats found"
            description="Try adjusting filters or add a new goat."
          />
        }
        columns={[
          { key: 'tag', header: 'Tag', render: (g) => g.tagNumber },
          { key: 'name', header: 'Name', render: (g) => g.name },
          { key: 'breed', header: 'Breed', render: (g) => g.breed },
          { key: 'gender', header: 'Gender', render: (g) => g.gender },
          {
            key: 'status',
            header: 'Status',
            render: (g) => <Badge tone={statusTone(g.status)}>{g.status}</Badge>,
          },
          { key: 'dob', header: 'DOB', render: (g) => formatDate(g.dateOfBirth) },
          { key: 'value', header: 'Value', render: (g) => formatCurrency(g.currentValue) },
          {
            key: 'owner',
            header: 'Owner',
            render: (g) => <OwnerBadge name={g.ownerName} isOwn={isOwnerOf(g.ownerId)} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (g) => (
              <div className="flex justify-end gap-1">
                <Link href={`/goats/${g.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                {canModifyRecord(g.ownerId) && (
                  <>
                    <Link href={`/goats/${g.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(g.id)}>
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
        title="Delete goat?"
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
