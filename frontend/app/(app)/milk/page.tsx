'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { milkService } from '@/services/milk';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { MilkRecord, MilkSession } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Badge,
  Button,
  OwnerBadge,
  EmptyState,
  ConfirmDialog,
  LoadingState,
  Pagination,
  Modal,
  Input,
  Textarea,
  StatCard,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import { usePagedList } from '@/lib/usePagedList';

const SESSION_OPTIONS: { label: string; value: MilkSession }[] = [
  { label: 'Morning', value: 'Morning' },
  { label: 'Evening', value: 'Evening' },
  { label: 'Combined', value: 'Combined' },
];

export default function MilkPage() {
  const { canModifyRecord, isOwnerOf } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<MilkRecord[]>([]);
  const [search, setSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MilkRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quantityKg, setQuantityKg] = useState('');
  const [session, setSession] = useState<MilkSession>('Morning');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setRows(await milkService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load milk records', 'error');
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
    return rows.filter((r) => {
      if (sessionFilter && r.session !== sessionFilter) return false;
      if (!q) return true;
      return (
        (r.notes ?? '').toLowerCase().includes(q) ||
        r.session.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q)
      );
    });
  }, [rows, search, sessionFilter]);

  const { page, setPage, paged, pageSize, total } = usePagedList(
    filtered,
    `${search}|${sessionFilter}`
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayKg = rows
    .filter((r) => r.date === today)
    .reduce((s, r) => s + r.quantityKg, 0);
  const monthPrefix = today.slice(0, 7);
  const monthKg = rows
    .filter((r) => r.date.startsWith(monthPrefix))
    .reduce((s, r) => s + r.quantityKg, 0);

  function openCreate() {
    setEditing(null);
    setDate(today);
    setQuantityKg('');
    setSession('Morning');
    setNotes('');
    setFormOpen(true);
  }

  function openEdit(row: MilkRecord) {
    setEditing(row);
    setDate(row.date);
    setQuantityKg(String(row.quantityKg));
    setSession(row.session);
    setNotes(row.notes ?? '');
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const kg = Number(quantityKg);
    if (!(kg > 0)) {
      toast('Enter milk quantity in kg', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date,
        quantityKg: kg,
        session,
        notes: notes.trim() || null,
      };
      if (editing) {
        const updated = await milkService.update(editing.id, payload);
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast('Milk record updated');
      } else {
        const created = await milkService.create(payload);
        setRows((prev) => [created, ...prev]);
        toast(`Milk recorded — ${kg} kg`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save milk record', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const row = rows.find((r) => r.id === deleteId);
    if (!row || !canModifyRecord(row.ownerId)) {
      toast('You cannot delete another user’s record', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await milkService.remove(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast('Milk record deleted');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
    setDeleteId(null);
  }

  return (
    <div>
      <PageHeader title="Milk Records" action={{ label: 'Record Milk', onClick: openCreate }} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Today" value={`${todayKg.toLocaleString()} kg`} />
        <StatCard label="This month" value={`${monthKg.toLocaleString()} kg`} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search notes…"
          className="sm:max-w-xs"
        />
        <Select
          options={SESSION_OPTIONS}
          placeholder="All sessions"
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="sm:w-40"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading milk records…" />
      ) : (
        <>
          <Table
            data={paged}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                title="No milk records"
                description="Record today’s milk yield in kilograms."
              />
            }
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              {
                key: 'session',
                header: 'Session',
                render: (r) => <Badge tone="info">{r.session}</Badge>,
              },
              {
                key: 'qty',
                header: 'Milk (kg)',
                render: (r) => (
                  <span className="font-semibold tabular-nums">
                    {r.quantityKg.toLocaleString()} kg
                  </span>
                ),
              },
              {
                key: 'notes',
                header: 'Notes',
                hideOnMobile: true,
                className: 'max-w-[12rem] truncate',
                render: (r) => r.notes?.trim() || '—',
              },
              {
                key: 'owner',
                header: 'Added by',
                hideOnMobile: true,
                render: (r) => (
                  <OwnerBadge name={r.ownerName} isOwn={isOwnerOf(r.ownerId)} />
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (r) =>
                  canModifyRecord(r.ownerId) ? (
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        aria-label="Edit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-fg hover:bg-muted hover:text-fg"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null,
              },
            ]}
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit milk record' : 'Record milk'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={closeForm}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="milk-form"
              className="w-full sm:w-auto"
              loading={saving}
              loadingText="Saving…"
            >
              Save
            </Button>
          </div>
        }
      >
        <form id="milk-form" onSubmit={(e) => void onSave(e)} className="grid gap-4">
          <Input
            label="Date"
            type="date"
            required
            value={date}
            disabled={saving}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Session"
            required
            value={session}
            disabled={saving}
            options={SESSION_OPTIONS}
            onChange={(e) => setSession(e.target.value as MilkSession)}
          />
          <Input
            label="Milk (kg)"
            type="number"
            required
            min={0.01}
            step="0.01"
            value={quantityKg}
            disabled={saving}
            hint="Measured in kilograms"
            onChange={(e) => setQuantityKg(e.target.value)}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={notes}
            disabled={saving}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete milk record?"
        description="This milk entry will be removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
