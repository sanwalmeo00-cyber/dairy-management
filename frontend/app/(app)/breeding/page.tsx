'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { breedingService } from '@/services/breeding';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Breeding, Goat } from '@/types/farm';
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

export default function BreedingPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Breeding[]>([]);
  const [goats, setGoats] = useState<Goat[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const goatTag = useCallback(
    (id: string) => goats.find((g) => g.id === id)?.tagNumber ?? id,
    [goats],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [breedings, herd] = await Promise.all([
          breedingService.getAll(),
          goatsService.getAll(),
        ]);
        setRows(breedings);
        setGoats(herd);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load breeding', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((b) => {
      if (status && b.status !== status) return false;
      if (!q) return true;
      return `${goatTag(b.femaleGoatId)} ${b.status}`.toLowerCase().includes(q);
    });
  }, [rows, search, status, goatTag]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const record = rows.find((b) => b.id === deleteId);
    if (!record || !canModifyRecord(record.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await breedingService.remove(record.id);
      setRows((prev) => prev.filter((b) => b.id !== record.id));
      toast('Breeding record deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((b) => b.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Breeding"
        description="Track mating, pregnancy, and kidding."
        action={{ label: 'Plan Breeding', href: '/breeding/new' }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search goats or status…"
          className="sm:max-w-xs"
        />
        <Select
          options={['Planned', 'Completed', 'Pregnant', 'Failed'].map((s) => ({
            label: s,
            value: s,
          }))}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(b) => b.id}
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No breeding records'}
            description={loading ? 'Fetching from the server.' : 'Plan a new breeding to get started.'}
          />
        }
        columns={[
          { key: 'female', header: 'Female', render: (b) => goatTag(b.femaleGoatId) },
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
        onConfirm={() => void confirmDelete()}
        title="Delete breeding record?"
        description={
          pending
            ? `Female “${goatTag(pending.femaleGoatId)}” will be marked as deleted.`
            : 'This record will be marked as deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
