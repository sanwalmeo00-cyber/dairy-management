import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { appConfig } from '../config';
import { ValidationError } from '../utils/errors';

let client: S3Client | null = null;

function getClient() {
  const { accessKeyId, secretAccessKey, region, endpoint } = appConfig.s3;
  if (!accessKeyId || !secretAccessKey || !appConfig.s3.bucket) {
    throw new ValidationError('S3 is not configured. Set AWS credentials and bucket.');
  }
  if (!client) {
    client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return client;
}

function publicUrl(key: string) {
  const bucket = appConfig.s3.bucket!;
  const encodedBucket = encodeURIComponent(bucket);
  if (appConfig.s3.publicBaseUrl) {
    return `${appConfig.s3.publicBaseUrl.replace(/\/$/, '')}/${encodedBucket}/${key
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;
  }
  if (appConfig.s3.endpoint) {
    return `${appConfig.s3.endpoint.replace(/\/$/, '')}/${encodedBucket}/${key}`;
  }
  return `https://${bucket}.s3.${appConfig.s3.region}.amazonaws.com/${key}`;
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImage(file: Express.Multer.File, folder: string) {
  if (!ALLOWED.has(file.mimetype)) {
    throw new ValidationError('Only JPEG, PNG, WebP, or GIF images are allowed');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new ValidationError('Image must be 5MB or smaller');
  }

  const ext =
    file.mimetype === 'image/png'
      ? 'png'
      : file.mimetype === 'image/webp'
        ? 'webp'
        : file.mimetype === 'image/gif'
          ? 'gif'
          : 'jpg';

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'misc';
  const key = `${safeFolder}/${randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: appConfig.s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Supabase often ignores ACL; public access is via bucket policy
    })
  );

  return {
    key,
    url: publicUrl(key),
    contentType: file.mimetype,
    size: file.size,
  };
}
