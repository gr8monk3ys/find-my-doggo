import type { Metadata } from 'next';
import Link from 'next/link';
import DogFilters from '@/components/DogFilters';
import DogMap from '@/components/DogMap';
import StatusBadge from '@/components/StatusBadge';
import { listDogs } from '@/lib/dogs';
import type { DogStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Map',
  description: 'See reported lost and found dogs plotted on a map by where they were last seen.',
};

const STATUSES: DogStatus[] = ['lost', 'found', 'reunited'];

const LEGEND: { status: DogStatus; color: string; label: string }[] = [
  { status: 'lost', color: 'bg-red-500', label: 'Lost dogs' },
  { status: 'found', color: 'bg-green-500', label: 'Found dogs' },
  { status: 'reunited', color: 'bg-blue-500', label: 'Reunited' },
];

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q } = await searchParams;
  const status = STATUSES.includes(rawStatus as DogStatus) ? (rawStatus as DogStatus) : undefined;

  const dogs = await listDogs({ status, query: q }).catch(() => []);
  const pinned = dogs.filter((dog) => dog.location.lat !== null && dog.location.lng !== null);
  const unpinned = dogs.filter((dog) => dog.location.lat === null || dog.location.lng === null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Map</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Every listing with a recognisable location is plotted here. Click a pin to open the listing.
        </p>
      </div>

      <div className="mb-6">
        <DogFilters basePath="/map" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DogMap dogs={pinned} />
          {pinned.length === 0 && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Nothing to plot for these filters yet.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-5">
            <h2 className="text-lg font-semibold mb-4">
              {pinned.length} {pinned.length === 1 ? 'dog' : 'dogs'} on the map
            </h2>
            <ul className="space-y-3 max-h-[330px] overflow-y-auto">
              {pinned.map((dog) => (
                <li key={dog.id}>
                  <Link
                    href={`/dogs/${dog.id}`}
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{dog.name}</span>
                      <StatusBadge status={dog.status} className="!text-xs !px-2 !py-0.5" />
                    </span>
                    <span className="block text-sm text-gray-600 dark:text-gray-400">{dog.breed}</span>
                    <span className="block text-xs text-gray-500 mt-1">{dog.location.address}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {unpinned.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-5">
              <h2 className="text-lg font-semibold mb-2">Not on the map</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                We couldn&apos;t resolve a location for {unpinned.length === 1 ? 'this listing' : 'these listings'}.
              </p>
              <ul className="space-y-2 text-sm">
                {unpinned.map((dog) => (
                  <li key={dog.id}>
                    <Link href={`/dogs/${dog.id}`} className="text-orange-500 hover:text-orange-600 font-medium">
                      {dog.name} — {dog.location.address}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-4">
            <h2 className="font-medium mb-3">Legend</h2>
            <ul className="space-y-2 text-sm">
              {LEGEND.map((item) => (
                <li key={item.status} className="flex items-center">
                  <span className={`w-4 h-4 rounded-full mr-2 ${item.color}`} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
