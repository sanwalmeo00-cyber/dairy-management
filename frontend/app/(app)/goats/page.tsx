'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
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
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Goat[]>([]);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await goatsService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load goats', 'error');
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
    return rows.filter((g) => {
      if (gender && g.gender !== gender) return false;
      if (status && g.status !== status) return false;
      if (!q) return true;
      return g.tagNumber.toLowerCase().includes(q) || g.breed.toLowerCase().includes(q);
    });
  }, [rows, search, gender, status]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const goat = rows.find((g) => g.id === deleteId);
    if (!goat || !canModifyRecord(goat.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await goatsService.remove(goat.id);
      setRows((prev) => prev.filter((g) => g.id !== goat.id));
      toast('Goat deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
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
          placeholder="Search tag, breed…"
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
            title={loading ? 'Loading…' : 'No goats found'}
            description={loading ? 'Fetching herd from the server.' : 'Try adjusting filters or add a new goat.'}
          />
        }
        columns={[
          {
            key: 'photo',
            header: '',
            render: (g) =>
              g.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <span className="inline-block h-9 w-9 rounded-md bg-muted" />
              ),
          },
          { key: 'tag', header: 'Tag', render: (g) => g.tagNumber },
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
        onConfirm={() => void confirmDelete()}
        title="Delete goat?"
        description={
          pending
            ? `Tag “${pending.tagNumber}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
