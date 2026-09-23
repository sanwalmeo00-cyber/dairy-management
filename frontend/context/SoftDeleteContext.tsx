'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DeletedRecord, SoftDeleteEntity, User } from '@/types/farm';

interface SoftDeleteContextValue {
  deleted: DeletedRecord[];
  softDelete: (input: {
    entity: SoftDeleteEntity;
    recordId: string;
    label: string;
    ownerId: string;
    ownerName: string;
    deletedBy: User;
  }) => void;
  restore: (id: string) => void;
  isDeleted: (entity: SoftDeleteEntity, recordId: string) => boolean;
  filterActive: <T extends { id: string }>(
    items: T[],
    entity: SoftDeleteEntity
  ) => T[];
}

const SoftDeleteContext = createContext<SoftDeleteContextValue | null>(null);
const STORAGE_KEY = 'gfms-soft-deleted';

const seedDeleted: DeletedRecord[] = [
  {
    id: 'del-seed-1',
    entity: 'goat',
    recordId: 'goat-seed-deleted',
    label: 'Old Buck (G099) — archived demo',
    ownerId: 'user-1',
    ownerName: 'Partner A',
    deletedAt: '2026-09-10T10:00:00.000Z',
    deletedBy: 'user-1',
    deletedByName: 'Partner A',
  },
];

export function SoftDeleteProvider({ children }: { children: ReactNode }) {
  const [deleted, setDeleted] = useState<DeletedRecord[]>(seedDeleted);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeletedRecord[];
        if (Array.isArray(parsed) && parsed.length) setDeleted(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deleted));
  }, [deleted]);

  const softDelete = useCallback(
    (input: {
      entity: SoftDeleteEntity;
      recordId: string;
      label: string;
      ownerId: string;
      ownerName: string;
      deletedBy: User;
    }) => {
      setDeleted((prev) => {
        if (prev.some((d) => d.entity === input.entity && d.recordId === input.recordId)) {
          return prev;
        }
        return [
          {
            id: `del-${Date.now()}`,
            entity: input.entity,
            recordId: input.recordId,
            label: input.label,
            ownerId: input.ownerId,
            ownerName: input.ownerName,
            deletedAt: new Date().toISOString(),
            deletedBy: input.deletedBy.id,
            deletedByName: input.deletedBy.name,
          },
          ...prev,
        ];
      });
    },
    []
  );

  const restore = useCallback((id: string) => {
    setDeleted((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const isDeleted = useCallback(
    (entity: SoftDeleteEntity, recordId: string) =>
      deleted.some((d) => d.entity === entity && d.recordId === recordId),
    [deleted]
  );

  const filterActive = useCallback(
    <T extends { id: string }>(items: T[], entity: SoftDeleteEntity) =>
      items.filter((item) => !isDeleted(entity, item.id)),
    [isDeleted]
  );

  const value = useMemo(
    () => ({ deleted, softDelete, restore, isDeleted, filterActive }),
    [deleted, softDelete, restore, isDeleted, filterActive]
  );

  return <SoftDeleteContext.Provider value={value}>{children}</SoftDeleteContext.Provider>;
}

export function useSoftDelete() {
  const ctx = useContext(SoftDeleteContext);
  if (!ctx) throw new Error('useSoftDelete must be used within SoftDeleteProvider');
  return ctx;
}
