'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { deletedService, type RestorableEntity } from '@/services/deleted';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Badge,
  Button,
  EmptyState,
  OwnerBadge,
  ConfirmDialog,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { DeletedRecord } from '@/types/farm';

const entityLabels: Record<RestorableEntity, string> = {
  goat: 'Goat',
  breeding: 'Breeding',
  kid: 'Kid',
  'goat-purchase': 'Goat Purchase',
  sale: 'Sale',
  expense: 'Expense',
  worker: 'Worker',
  inventory: 'Inventory',
};

const restoreRoutes: Partial<Record<RestorableEntity, string>> = {
  goat: '/goats',
  breeding: '/breeding',
  kid: '/kids',
  'goat-purchase': '/goat-purchases',
  sale: '/sales',
  expense: '/expenses',
  worker: '/workers',
  inventory: '/inventory',
};

export default function DeletedPage() {
  const { isSuperAdmin, isOwnerOf, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<DeletedRecord[]>([]);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await deletedService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load deleted records', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((d) => {
      if (entity && d.entity !== entity) return false;
      if (!q) return true;
      return (
        d.label.toLowerCase().includes(q) ||
        d.ownerName.toLowerCase().includes(q) ||
        d.deletedByName.toLowerCase().includes(q)
      );
    });
  }, [rows, search, entity]);

  const pending = rows.find((d) => d.id === restoreId);

  const confirmRestore = async () => {
    if (!pending) return;
    try {
      await deletedService.restore(pending.entity as RestorableEntity, pending.recordId);
      toast('Record restored');
      setRestoreId(null);
      await load();
      const href = restoreRoutes[pending.entity as RestorableEntity];
      if (href) router.push(href);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to restore', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Deleted"
        description="Soft-deleted records stay in the system with a deleted tag. Restore when needed."
      />

      <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-fg">
        Delete does <strong className="text-foreground">not</strong> remove data from the database.
        Records are marked deleted and listed here
        {isSuperAdmin ? ' for the whole farm' : ' for your own records'}.
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search deleted items…"
          className="sm:max-w-xs"
        />
        <Select
          options={(Object.keys(entityLabels) as RestorableEntity[]).map((k) => ({
            label: entityLabels[k],
            value: k,
          }))}
          placeholder="All types"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="sm:w-44"
        />
      </div>

      <Table
        data={visible}
        rowKey={(d) => d.id}
        empty={
          <EmptyState
            title={loading ? 'Loading…' : 'No deleted records'}
            description="When you delete something, it appears here tagged as deleted."
          />
        }
        columns={[
          {
            key: 'tag',
            header: 'Tag',
            render: () => <Badge tone="danger">Deleted</Badge>,
          },
          {
            key: 'type',
            header: 'Type',
            render: (d) => entityLabels[d.entity as RestorableEntity] ?? d.entity,
          },
          { key: 'label', header: 'Record', render: (d) => d.label },
          {
            key: 'owner',
            header: 'Owner',
            render: (d) => <OwnerBadge name={d.ownerName} isOwn={isOwnerOf(d.ownerId)} />,
          },
          {
            key: 'by',
            header: 'Deleted by',
            render: (d) => d.deletedByName,
          },
          {
            key: 'at',
            header: 'Deleted at',
            render: (d) => formatDate(d.deletedAt),
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (d) => {
              const canRestore = isSuperAdmin || d.ownerId === currentUser.id;
              if (!canRestore) return null;
              return (
                <Button variant="outline" size="sm" onClick={() => setRestoreId(d.id)}>
                  Restore
                </Button>
              );
            },
          },
        ]}
      />

      <ConfirmDialog
        open={!!restoreId}
        onClose={() => setRestoreId(null)}
        onConfirm={() => void confirmRestore()}
        title="Restore record?"
        description={
          pending
            ? `Restore “${pending.label}”? It will leave the Deleted tab and show again in its list.`
            : 'Restore this record?'
        }
        confirmLabel="Restore"
        confirmVariant="primary"
      />
    </div>
  );
}
