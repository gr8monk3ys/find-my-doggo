import { ensureSchema, getClient } from './db';
import type { Dog, DogListFilters, DogStatus, DogWithContact } from './types';
import type { ReportInput } from './validation';

type Row = Record<string, unknown>;

const SELECT_COLUMNS = `id, name, breed, color, description, status, image_url,
                        address, lat, lng, contact_email, contact_phone, created_at`;

function str(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function nullableStr(value: unknown): string | null {
  return value == null ? null : str(value);
}

function nullableNum(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function rowToDogWithContact(row: Row): DogWithContact {
  return {
    id: str(row.id),
    name: str(row.name),
    breed: str(row.breed),
    color: str(row.color),
    description: str(row.description),
    status: str(row.status) as DogStatus,
    imageUrl: nullableStr(row.image_url),
    location: {
      address: str(row.address),
      lat: nullableNum(row.lat),
      lng: nullableNum(row.lng),
    },
    dateReported: str(row.created_at),
    contactEmail: str(row.contact_email),
    contactPhone: nullableStr(row.contact_phone),
  };
}

/**
 * Strips the reporter's contact details. Everything served to the browser goes
 * through here so an email address never reaches a public response — leaking
 * them invites scraping, and they are the one piece of PII this app holds.
 */
export function toPublicDog(dog: DogWithContact): Dog {
  const { contactEmail: _email, contactPhone: _phone, ...rest } = dog;
  void _email;
  void _phone;
  return rest;
}

/** Escapes the LIKE wildcards so a search for "100%" is not a match-everything. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listDogs(filters: DogListFilters = {}): Promise<Dog[]> {
  await ensureSchema();

  const where: string[] = [];
  const args: unknown[] = [];

  if (filters.status) {
    where.push('status = ?');
    args.push(filters.status);
  }

  const query = filters.query?.trim();
  if (query) {
    where.push(`(lower(name) LIKE ? ESCAPE '\\'
             OR lower(breed) LIKE ? ESCAPE '\\'
             OR lower(address) LIKE ? ESCAPE '\\')`);
    const pattern = `%${escapeLike(query.toLowerCase())}%`;
    args.push(pattern, pattern, pattern);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  const sql = `SELECT ${SELECT_COLUMNS} FROM dogs
               ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY created_at DESC
               LIMIT ?`;

  const result = await getClient().execute({ sql, args: [...args, limit] as never });
  return result.rows.map((row) => toPublicDog(rowToDogWithContact(row as Row)));
}

export async function countByStatus(): Promise<Record<DogStatus, number>> {
  await ensureSchema();
  const result = await getClient().execute('SELECT status, COUNT(*) AS n FROM dogs GROUP BY status');
  const counts: Record<DogStatus, number> = { lost: 0, found: 0, reunited: 0 };
  for (const row of result.rows) {
    const status = str((row as Row).status) as DogStatus;
    if (status in counts) counts[status] = Number((row as Row).n ?? 0);
  }
  return counts;
}

export async function getDogWithContact(id: string): Promise<DogWithContact | null> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: `SELECT ${SELECT_COLUMNS} FROM dogs WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0] as Row | undefined;
  return row ? rowToDogWithContact(row) : null;
}

export async function getDog(id: string): Promise<Dog | null> {
  const dog = await getDogWithContact(id);
  return dog ? toPublicDog(dog) : null;
}

/**
 * The public report form only offers lost/found, but the store itself has to
 * hold 'reunited' too — that is where a listing ends up once the dog is home.
 */
export interface CreateDogInput extends Omit<ReportInput, 'status'> {
  status: DogStatus;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
}

export async function createDog(input: CreateDogInput): Promise<Dog> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await getClient().execute({
    sql: `INSERT INTO dogs (id, name, breed, color, description, status, image_url,
                            address, lat, lng, contact_email, contact_phone,
                            created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.name,
      input.breed,
      input.color,
      input.description,
      input.status,
      input.imageUrl,
      input.address,
      input.lat,
      input.lng,
      input.contactEmail,
      input.contactPhone ?? null,
      now,
      now,
    ],
  });

  return {
    id,
    name: input.name,
    breed: input.breed,
    color: input.color,
    description: input.description,
    status: input.status,
    imageUrl: input.imageUrl,
    location: { address: input.address, lat: input.lat, lng: input.lng },
    dateReported: now,
  };
}
