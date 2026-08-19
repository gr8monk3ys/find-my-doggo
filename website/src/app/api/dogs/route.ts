import { NextResponse } from 'next/server';
import { createDog, listDogs } from '@/lib/dogs';
import { geocode } from '@/lib/geocode';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { saveImage } from '@/lib/storage';
import type { DogStatus } from '@/lib/types';
import { fieldErrors, reportSchema, validateImage } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const REPORTS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
const STATUSES: DogStatus[] = ['lost', 'found', 'reunited'];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawStatus = params.get('status');
  const status = STATUSES.includes(rawStatus as DogStatus) ? (rawStatus as DogStatus) : undefined;

  try {
    const dogs = await listDogs({
      status,
      query: params.get('q') ?? undefined,
      limit: Number(params.get('limit')) || undefined,
    });
    return NextResponse.json({ dogs });
  } catch (error) {
    console.error('[api/dogs] list failed', error);
    return NextResponse.json({ error: 'Could not load listings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`report:${clientKey(request)}`, REPORTS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many reports from this address. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected a multipart form submission.' }, { status: 400 });
  }

  const parsed = reportSchema.safeParse({
    name: form.get('name') ?? undefined,
    breed: form.get('breed') ?? undefined,
    color: form.get('color') ?? undefined,
    description: form.get('description') ?? undefined,
    status: form.get('status') ?? undefined,
    address: form.get('address') ?? undefined,
    contactEmail: form.get('contactEmail') ?? undefined,
    contactPhone: form.get('contactPhone') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const photo = form.get('photo');
  let imageUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    const imageError = validateImage(photo);
    if (imageError) {
      return NextResponse.json({ error: imageError, fields: { photo: imageError } }, { status: 400 });
    }
    try {
      imageUrl = await saveImage(photo);
    } catch (error) {
      console.error('[api/dogs] photo upload failed', error);
      return NextResponse.json({ error: 'Could not save the photo. Please try again.' }, { status: 502 });
    }
  }

  // A missing pin is acceptable; a rejected report is not.
  const coordinates = await geocode(parsed.data.address);

  try {
    const dog = await createDog({
      ...parsed.data,
      imageUrl,
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
    });
    return NextResponse.json({ dog }, { status: 201 });
  } catch (error) {
    console.error('[api/dogs] create failed', error);
    return NextResponse.json({ error: 'Could not save the report. Please try again.' }, { status: 500 });
  }
}
