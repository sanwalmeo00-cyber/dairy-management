import { api } from '@/lib/api';
import type { DeletedRecord, SoftDeleteEntity } from '@/types/farm';

export type RestorableEntity = Exclude<SoftDeleteEntity, 'purchase'>;

export const deletedService = {
  async getAll(entity?: RestorableEntity): Promise<DeletedRecord[]> {
    const q = entity ? `?entity=${encodeURIComponent(entity)}` : '';
    return api.get<DeletedRecord[]>(`/deleted${q}`);
  },
  async restore(entity: RestorableEntity, recordId: string) {
    return api.post<{ entity: string; recordId: string; restored: boolean }>(
      '/deleted/restore',
      { entity, recordId }
    );
  },
};
