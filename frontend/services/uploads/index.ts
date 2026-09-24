import { api } from '@/lib/api';

export type UploadResult = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

export const uploadsService = {
  async uploadImage(file: File, folder: 'goats' | 'kids'): Promise<UploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return api.upload<UploadResult>('/uploads/image', fd);
  },
};
