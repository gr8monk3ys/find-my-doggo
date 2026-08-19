import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

// Point the client at a throwaway SQLite file before the module is loaded.
const dir = mkdtempSync(path.join(tmpdir(), 'fmd-test-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;

const { getClient, ensureSchema, resetClientForTests } = await import('@/lib/db');
const { countByStatus, createDog, getDog, getDogWithContact, listDogs, toPublicDog } = await import('@/lib/dogs');

const BASE = {
  name: 'Max',
  breed: 'Golden Retriever',
  color: 'Golden',
  description: 'Friendly golden retriever wearing a blue collar.',
  status: 'lost' as const,
  address: 'Central Park, New York',
  contactEmail: 'owner@example.com',
  contactPhone: '555-0101',
  imageUrl: null,
  lat: 40.785091,
  lng: -73.968285,
};

beforeEach(async () => {
  await ensureSchema();
  await getClient().execute('DELETE FROM dogs');
});

afterAll(() => {
  resetClientForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe('createDog / getDog', () => {
  it('round-trips a report and returns it by id', async () => {
    const created = await createDog(BASE);
    const found = await getDog(created.id);

    expect(found?.name).toBe('Max');
    expect(found?.location).toEqual({ address: 'Central Park, New York', lat: 40.785091, lng: -73.968285 });
    expect(found?.dateReported).toBe(created.dateReported);
  });

  it('stores a report with no photo and no resolvable location', async () => {
    const created = await createDog({ ...BASE, imageUrl: null, lat: null, lng: null });
    const found = await getDog(created.id);
    expect(found?.imageUrl).toBeNull();
    expect(found?.location.lat).toBeNull();
  });

  it('returns null for an unknown id', async () => {
    expect(await getDog('does-not-exist')).toBeNull();
  });
});

describe('contact details', () => {
  it('never exposes the reporter email through the public shape', async () => {
    const created = await createDog(BASE);

    const publicDog = await getDog(created.id);
    expect(JSON.stringify(publicDog)).not.toContain('owner@example.com');
    expect(publicDog).not.toHaveProperty('contactEmail');
    expect(publicDog).not.toHaveProperty('contactPhone');

    // The server-side accessor still has what it needs to forward a message.
    const privateDog = await getDogWithContact(created.id);
    expect(privateDog?.contactEmail).toBe('owner@example.com');
    expect(toPublicDog(privateDog!)).not.toHaveProperty('contactEmail');
  });

  it('keeps contact details out of list results', async () => {
    await createDog(BASE);
    expect(JSON.stringify(await listDogs())).not.toContain('owner@example.com');
  });
});

describe('listDogs', () => {
  beforeEach(async () => {
    await createDog(BASE);
    await createDog({ ...BASE, name: 'Bella', breed: 'Labrador', status: 'found', address: 'Riverside, Chicago' });
    await createDog({ ...BASE, name: 'Charlie', breed: 'French Bulldog', status: 'reunited', address: 'Brooklyn' });
  });

  it('filters by status', async () => {
    const found = await listDogs({ status: 'found' });
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('Bella');
  });

  it('searches name, breed, and address case-insensitively', async () => {
    expect(await listDogs({ query: 'BELLA' })).toHaveLength(1);
    expect(await listDogs({ query: 'labrador' })).toHaveLength(1);
    expect(await listDogs({ query: 'chicago' })).toHaveLength(1);
  });

  it('treats LIKE wildcards in the query as literal characters', async () => {
    // Without escaping, "%" would match every row rather than none.
    expect(await listDogs({ query: '%' })).toHaveLength(0);
    expect(await listDogs({ query: '_' })).toHaveLength(0);
  });

  it('returns newest first', async () => {
    const names = (await listDogs()).map((dog) => dog.name);
    expect(names[0]).toBe('Charlie');
  });

  it('clamps the limit to a sane range', async () => {
    expect(await listDogs({ limit: 1 })).toHaveLength(1);
    expect(await listDogs({ limit: 100_000 })).toHaveLength(3);
  });
});

describe('countByStatus', () => {
  it('counts each status and reports zero for the rest', async () => {
    await createDog(BASE);
    await createDog({ ...BASE, status: 'found' });
    expect(await countByStatus()).toEqual({ lost: 1, found: 1, reunited: 0 });
  });
});
