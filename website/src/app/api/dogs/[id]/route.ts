import { NextResponse } from 'next/server';
import { getDog } from '@/lib/dogs';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dog = await getDog(id);
    if (!dog) return NextResponse.json({ error: 'Dog not found.' }, { status: 404 });
    return NextResponse.json({ dog });
  } catch (error) {
    console.error('[api/dogs/:id] lookup failed', error);
    return NextResponse.json({ error: 'Could not load this listing.' }, { status: 500 });
  }
}
