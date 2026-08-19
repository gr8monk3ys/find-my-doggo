import { NextResponse } from 'next/server';
import { ensureSchema, getClient } from '@/lib/db';
import { isEmailConfigured } from '@/lib/notify';
import { isDurableStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Readiness probe. Reports which optional integrations are wired up so a
 * deployment can be checked without guessing at the environment.
 */
export async function GET() {
  const integrations = {
    durableImageStorage: isDurableStorage(),
    emailDelivery: isEmailConfigured(),
  };

  try {
    await ensureSchema();
    await getClient().execute('SELECT 1');
    return NextResponse.json({ status: 'ok', database: 'reachable', integrations });
  } catch (error) {
    console.error('[api/health] database unreachable', error);
    return NextResponse.json({ status: 'degraded', database: 'unreachable', integrations }, { status: 503 });
  }
}
