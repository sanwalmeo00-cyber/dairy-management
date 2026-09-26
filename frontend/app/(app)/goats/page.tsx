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
  LoadingState,
  Pagination,
} from '@/components/ui';
import { formatCurrency, formatAgeMonths } from '@/lib/format';

const PAGE_SIZE = 10;

export default function GoatsPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Goat[]>([]);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await goatsService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load animals', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, gender, status]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((g) => {
      if (gender && g.gender !== gender) return false;
      if (status) {
        const gStatus = g.status === 'Active' ? 'Healthy' : g.status;
        if (gStatus !== status) return false;
      }
      if (!q) return true;
      return g.tagNumber.toLowerCase().includes(q) || g.breed.toLowerCase().includes(q);
    });
  }, [rows, search, gender, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

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
      toast('Animal deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  };

  const pending = rows.find((g) => g.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Animals"
        description="Manage animals by tag — health, status, and ownership."
        action={{ label: 'Add Animal', href: '/goats/new' }}
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
        <LoadingState label="Loading animals…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(g) => g.id}
            empty={
              <EmptyState
                title="No animals found"
                description="Try adjusting filters or add a new animal."
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
                render: (g) => {
                  const label = g.status === 'Active' ? 'Healthy' : g.status;
                  return <Badge tone={statusTone(label)}>{label}</Badge>;
                },
              },
              { key: 'age', header: 'Age', render: (g) => formatAgeMonths(g.dateOfBirth) },
              { key: 'value', header: 'Value', render: (g) => formatCurrency(g.currentValue) },
              {
                key: 'owner',
                header: 'Added by',
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
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete animal?"
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
