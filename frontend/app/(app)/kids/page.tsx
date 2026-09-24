'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { kidsService } from '@/services/kids';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Goat, Kid } from '@/types/farm';
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

export default function KidsPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Kid[]>([]);
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
        const [kids, herd] = await Promise.all([kidsService.getAll(), goatsService.getAll()]);
        setRows(kids);
        setGoats(herd);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load kids', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((k) => {
      if (status && k.status !== status) return false;
      if (!q) return true;
      return (
        k.tagNumber.toLowerCase().includes(q) ||
        goatTag(k.motherId).toLowerCase().includes(q)
      );
    });
  }, [rows, search, status, goatTag]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const kid = rows.find((k) => k.id === deleteId);
    if (!kid || !canModifyRecord(kid.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await kidsService.remove(kid.id);
      setRows((prev) => prev.filter((k) => k.id !== kid.id));
      toast('Kid deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((k) => k.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Kids"
        description="Young goats from your breeding program."
        action={{ label: 'Register Kid', href: '/kids/new' }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tag, mother…"
          className="sm:max-w-xs"
        />
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
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No kids found'}
            description={loading ? 'Fetching from the server.' : 'Register a kid or adjust filters.'}
          />
        }
        columns={[
          {
            key: 'photo',
            header: '',
            render: (k) =>
              k.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={k.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <span className="inline-block h-9 w-9 rounded-md bg-muted" />
              ),
          },
          { key: 'tag', header: 'Tag', render: (k) => k.tagNumber },
          { key: 'gender', header: 'Gender', render: (k) => k.gender },
          { key: 'dob', header: 'DOB', render: (k) => formatDate(k.dateOfBirth) },
          { key: 'mother', header: 'Mother', render: (k) => goatTag(k.motherId) },
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
        onConfirm={() => void confirmDelete()}
        title="Delete kid?"
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
