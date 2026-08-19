/**
 * Loads a handful of sample listings so a fresh checkout has something to show.
 * Idempotent: the fixed ids mean re-running replaces rather than duplicates.
 * Sample rows use example.com addresses and are safe to delete at any time.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';

const SAMPLE_DOGS = [
  {
    id: 'sample-max',
    name: 'Max',
    breed: 'Golden Retriever',
    color: 'Golden',
    description: 'Friendly golden retriever, wearing a blue collar. Very playful and responds to his name.',
    status: 'lost',
    image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=800&fit=crop',
    address: 'Central Park, New York',
    lat: 40.785091,
    lng: -73.968285,
    contact_email: 'owner1@example.com',
    contact_phone: '555-0101',
  },
  {
    id: 'sample-shepherd',
    name: 'Unknown',
    breed: 'German Shepherd',
    color: 'Black and Tan',
    description: 'Found wandering near the grocery store. No collar, appears well-fed and trained.',
    status: 'found',
    image_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&h=800&fit=crop',
    address: 'Downtown, Los Angeles',
    lat: 34.052235,
    lng: -118.243683,
    contact_email: 'finder1@example.com',
    contact_phone: null,
  },
  {
    id: 'sample-bella',
    name: 'Bella',
    breed: 'Labrador',
    color: 'Chocolate',
    description: 'Sweet chocolate lab, spayed, microchipped. Last seen chasing a squirrel.',
    status: 'lost',
    image_url: 'https://images.unsplash.com/photo-1579213838058-8a73d0b5d5aa?w=800&h=800&fit=crop',
    address: 'Riverside Park, Chicago',
    lat: 41.878113,
    lng: -87.629799,
    contact_email: 'owner2@example.com',
    contact_phone: '555-0202',
  },
  {
    id: 'sample-beagle',
    name: 'Unknown',
    breed: 'Beagle',
    color: 'Tricolor',
    description: 'Small beagle found in the park. Has a red collar but no tags.',
    status: 'found',
    image_url: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&h=800&fit=crop',
    address: 'Golden Gate Park, San Francisco',
    lat: 37.769421,
    lng: -122.486214,
    contact_email: 'finder2@example.com',
    contact_phone: null,
  },
  {
    id: 'sample-charlie',
    name: 'Charlie',
    breed: 'French Bulldog',
    color: 'Brindle',
    description: 'Small French Bulldog with distinctive bat ears. Very friendly, loves treats.',
    status: 'reunited',
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop',
    address: 'Brooklyn, New York',
    lat: 40.650002,
    lng: -73.949997,
    contact_email: 'owner3@example.com',
    contact_phone: null,
  },
  {
    id: 'sample-luna',
    name: 'Luna',
    breed: 'Husky',
    color: 'White and Gray',
    description: 'Beautiful husky with blue eyes. Escaped during a thunderstorm.',
    status: 'lost',
    image_url: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&h=800&fit=crop',
    address: 'Seattle, Washington',
    lat: 47.606209,
    lng: -122.332069,
    contact_email: 'owner4@example.com',
    contact_phone: '555-0404',
  },
];

const url = process.env.DATABASE_URL ?? 'file:./data/dev.db';

// libSQL creates the file but not the directory holding it.
if (url.startsWith('file:')) {
  mkdirSync(path.dirname(path.resolve(url.slice('file:'.length))), { recursive: true });
}

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

await client.batch(
  [
    `CREATE TABLE IF NOT EXISTS dogs (
       id            TEXT PRIMARY KEY,
       name          TEXT NOT NULL,
       breed         TEXT NOT NULL,
       color         TEXT NOT NULL,
       description   TEXT NOT NULL,
       status        TEXT NOT NULL CHECK (status IN ('lost', 'found', 'reunited')),
       image_url     TEXT,
       address       TEXT NOT NULL,
       lat           REAL,
       lng           REAL,
       contact_email TEXT NOT NULL,
       contact_phone TEXT,
       created_at    TEXT NOT NULL,
       updated_at    TEXT NOT NULL
     )`,
  ],
  'write',
);

// Spread the timestamps so "most recent first" ordering is stable and visible.
const now = Date.now();
let inserted = 0;

for (const [index, dog] of SAMPLE_DOGS.entries()) {
  const timestamp = new Date(now - index * 86_400_000).toISOString();
  await client.execute({
    sql: `INSERT OR REPLACE INTO dogs
            (id, name, breed, color, description, status, image_url, address, lat, lng,
             contact_email, contact_phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      dog.id, dog.name, dog.breed, dog.color, dog.description, dog.status, dog.image_url,
      dog.address, dog.lat, dog.lng, dog.contact_email, dog.contact_phone, timestamp, timestamp,
    ],
  });
  inserted += 1;
}

console.log(`Seeded ${inserted} sample listings.`);
client.close();
