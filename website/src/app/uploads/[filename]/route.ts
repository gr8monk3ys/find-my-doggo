import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { isDurableStorage, resolveLocalUpload } from '@/lib/storage';

/**
 * Serves photos held by the local-disk storage adapter. When Vercel Blob is
 * configured, images are served from Blob's own CDN and this route is unused.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (isDurableStorage()) return new NextResponse(null, { status: 404 });

  const { filename } = await params;
  const target = resolveLocalUpload(filename);
  if (!target) return new NextResponse(null, { status: 404 });

  try {
    const body = await readFile(target.path);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': target.contentType,
        // Filenames are content-addressed by UUID, so they never change.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
