import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from '../config';
import { ValidationError } from '../utils/errors';

export type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

let configured = false;

function ensureCloudinary() {
  let cloudName = appConfig.cloudinary.cloudName;
  let apiKey = appConfig.cloudinary.apiKey;
  let apiSecret = appConfig.cloudinary.apiSecret;

  if ((!cloudName || !apiKey || !apiSecret) && appConfig.cloudinary.url) {
    try {
      const parsed = new URL(appConfig.cloudinary.url);
      cloudName = cloudName || parsed.hostname;
      apiKey = apiKey || decodeURIComponent(parsed.username);
      apiSecret = apiSecret || decodeURIComponent(parsed.password);
    } catch {
      /* ignore bad URL */
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ValidationError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImage(file: UploadFile, folder: string) {
  ensureCloudinary();

  if (!ALLOWED.has(file.mimetype)) {
    throw new ValidationError('Only JPEG, PNG, WebP, or GIF images are allowed');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new ValidationError('Image must be 5MB or smaller');
  }

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'misc';
  const publicId = `${safeFolder}/${randomUUID()}`;
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `sms-dairy/${safeFolder}`,
    public_id: publicId.split('/').pop(),
    resource_type: 'image',
    overwrite: false,
  });

  return {
    key: result.public_id,
    url: result.secure_url,
    contentType: file.mimetype,
    size: file.size,
  };
}
