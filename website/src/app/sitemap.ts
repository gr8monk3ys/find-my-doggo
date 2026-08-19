import type { MetadataRoute } from 'next';
import { listDogs } from '@/lib/dogs';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

const STATIC_PATHS = ['', '/dogs', '/map', '/report', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' || path === '/dogs' ? 'hourly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));

  // A missing database should degrade the sitemap, not fail the build.
  const dogs = await listDogs({ limit: 200 }).catch(() => []);
  for (const dog of dogs) {
    entries.push({
      url: `${base}/dogs/${dog.id}`,
      lastModified: new Date(dog.dateReported),
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  return entries;
}
