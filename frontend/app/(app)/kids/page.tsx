'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { kidsService } from '@/services/kids';
import { useAuth } from '@/context/AuthContext';
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
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

export default function KidsPage() {
  const router = useRouter();
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Kid[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await kidsService.getAll());
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
      if (status) {
        const kStatus = k.status === 'Active' ? 'Healthy' : k.status;
        if (kStatus !== status) return false;
      }
      if (!q) return true;
      return (
        k.tagNumber.toLowerCase().includes(q) ||
        (k.motherTag ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${status}`
  );

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
        description="Births from your herd. Each kid is also added to Animals."
        action={{ label: 'Record Birth', href: '/kids/new' }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tag, mother…"
          className="sm:max-w-xs"
        />
        <Select
          options={[
            { label: 'Healthy', value: 'Healthy' },
            { label: 'Ill', value: 'Ill' },
            { label: 'Under Treatment', value: 'Under Treatment' },
            { label: 'Recovering', value: 'Recovering' },
            { label: 'Pregnant', value: 'Pregnant' },
            { label: 'Sold', value: 'Sold' },
            { label: 'Deceased', value: 'Deceased' },
          ]}
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading kids…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(k) => k.id}
            onRowClick={(k) => router.push(`/kids/${k.id}`)}
            empty={
              <EmptyState
                title="No kids found"
                description="Record a birth when a pregnant animal delivers."
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
              { key: 'mother', header: 'Mother', render: (k) => k.motherTag ?? '—' },
              {
                key: 'status',
                header: 'Status',
                render: (k) => {
                  const label = k.status === 'Active' ? 'Healthy' : k.status;
                  return <Badge tone={statusTone(label)}>{label}</Badge>;
                },
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
                    {k.goatId && (
                      <Link href={`/goats/${k.goatId}`}>
                        <Button variant="outline" size="sm">
                          Animal
                        </Button>
                      </Link>
                    )}
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
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete kid?"
        description={
          pending
            ? `Tag “${pending.tagNumber}” will be deleted.`
            : 'This record will be deleted.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
