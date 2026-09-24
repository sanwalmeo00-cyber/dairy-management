import { apiRoute, jsonSuccess, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { uploadImage } from '@/server/services/uploads.service';
import { ValidationError } from '@/server/utils/errors';

export const POST = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('Image file is required');
  }

  const folderRaw = typeof form.get('folder') === 'string' ? String(form.get('folder')) : 'goats';
  const folder = ['goats', 'kids'].includes(folderRaw) ? folderRaw : 'goats';

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(
    {
      buffer,
      mimetype: file.type || 'application/octet-stream',
      size: buffer.length,
    },
    folder
  );
  return jsonSuccess(result, 201, 'Image uploaded');
});
