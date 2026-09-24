import { Response } from 'express';
import { uploadImage } from '../services/uploads.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errors';

export const uploadAnimalImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) throw new ValidationError('Image file is required');

  const folderRaw = typeof req.body.folder === 'string' ? req.body.folder : 'goats';
  const folder = ['goats', 'kids'].includes(folderRaw) ? folderRaw : 'goats';

  const result = await uploadImage(file, folder);
  return sendSuccess(res, result, 201, 'Image uploaded');
});
