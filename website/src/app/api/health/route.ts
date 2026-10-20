import { NextResponse } from 'next/server';
import { version } from '../../../../package.json';
import { ensureSchema, getClient } from '@/lib/db';
import { features } from '@/lib/features';
import { supportMailStats } from '@/lib/support-mail';

export const dynamic = 'force-dynamic';

/**
 * Readiness probe. Reports which optional integrations are wired up, how long
 * the database took to answer, and whether either support-mail cap is full,
 * so a deployment can be checked without guessing at the environment.
 */
export async function GET() {
  const flags = features();
  const started = performance.now();

  try {
    await ensureSchema();
    await getClient().execute('SELECT 1');
    const databaseLatencyMs = Math.round(performance.now() - started);
    const mail = await supportMailStats();
    return NextResponse.json({ status: 'ok', version, database: 'reachable', databaseLatencyMs, features: flags, mail });
  } catch (error) {
    console.error('[api/health] database unreachable', error);
    const databaseLatencyMs = Math.round(performance.now() - started);
    return NextResponse.json(
      { status: 'degraded', version, database: 'unreachable', databaseLatencyMs, features: flags },
      { status: 503 },
    );
  }
}
