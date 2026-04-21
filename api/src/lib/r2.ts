import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId       = process.env.R2_ACCOUNT_ID!;
const accessKeyId     = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket          = process.env.R2_BUCKET_NAME!;
const publicUrl       = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

const s3 = new S3Client({
  region:   'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));
  return `${publicUrl}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function r2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length + 1); // strip leading slash
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}
