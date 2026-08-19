import type { Metadata } from 'next';
import Link from 'next/link';
import DogCard from '@/components/DogCard';
import DogFilters from '@/components/DogFilters';
import { listDogs } from '@/lib/dogs';
import type { DogStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lost & found dogs',
  description: 'Browse reported lost and found dogs, filtered by status, breed, name, or location.',
};

const STATUSES: DogStatus[] = ['lost', 'found', 'reunited'];

export default async function DogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q } = await searchParams;
  const status = STATUSES.includes(rawStatus as DogStatus) ? (rawStatus as DogStatus) : undefined;

  let dogs: Awaited<ReturnType<typeof listDogs>> = [];
  let failed = false;
  try {
    dogs = await listDogs({ status, query: q });
  } catch {
    failed = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lost &amp; found dogs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse reported dogs and open a listing to message whoever posted it.
        </p>
      </div>

      <div className="mb-8">
        <DogFilters />
      </div>

      {failed ? (
        <p className="text-red-600 dark:text-red-400">
          We couldn&apos;t load the listings just now. Please refresh in a moment.
        </p>
      ) : (
        <>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {dogs.length} {dogs.length === 1 ? 'listing' : 'listings'}
            {q ? ` matching “${q}”` : ''}
          </p>

          {dogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl mb-4" aria-hidden="true">
                🐕
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">No dogs match those filters yet.</p>
              <Link
                href="/report"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Report a dog
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
