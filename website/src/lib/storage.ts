import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Local uploads are written under `data/`, not `public/`, and served by the
 * /uploads route handler. `next start` resolves `public/` once at boot, so a
 * file written there after the server starts would 404 until a restart —
 * exactly the case that matters here, since every upload is written at runtime.
 */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

/**
 * Two adapters behind one call. Local disk keeps `npm run dev` working with no
 * account or token; Vercel Blob takes over as soon as BLOB_READ_WRITE_TOKEN is
 * present, which is what a serverless deployment needs — its filesystem is
 * read-only and not shared between instances.
 */
export async function saveImage(file: File): Promise<string> {
  const extension = EXTENSIONS[file.type] ?? 'jpg';
  const filename = `${crypto.randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`dogs/${filename}`, file, { access: 'public', contentType: file.type });
    return blob.url;
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

/** True when uploads survive a redeploy. Surfaced in the health check. */
export function isDurableStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const FILENAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Only names this module could itself have generated are servable, so a crafted
 * path can never escape the upload directory.
 */
export function resolveLocalUpload(filename: string): { path: string; contentType: string } | null {
  if (!FILENAME_PATTERN.test(filename)) return null;
  const extension = filename.split('.').pop()!;
  return {
    path: path.join(LOCAL_UPLOAD_DIR, filename),
    contentType: CONTENT_TYPES[extension],
  };
}
