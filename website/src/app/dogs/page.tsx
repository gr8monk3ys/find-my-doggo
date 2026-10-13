import type { Metadata } from 'next';
import DogCard from '@/components/DogCard';
import DogFilters from '@/components/DogFilters';
import { ButtonLink } from '@/components/ui/button';
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-2xl">
        <p className="label-mono">The board</p>
        <h1 className="text-page-title mt-3">Lost &amp; found dogs</h1>
        <p className="mt-4 text-muted-foreground">Browse reported dogs and open a listing to message whoever posted it.</p>
      </header>

      <div className="mt-10">
        <DogFilters />
      </div>

      <hr className="gallery-rule mt-8" />

      {failed ? (
        <p role="alert" className="mt-8 text-destructive">
          We couldn&apos;t load the listings just now. Please refresh in a moment.
        </p>
      ) : (
        <>
          <p className="label-mono mt-8">
            {dogs.length} {dogs.length === 1 ? 'listing' : 'listings'}
            {q ? ` matching “${q}”` : ''}
          </p>

          {dogs.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="mt-10 max-w-xl">
              <p className="label-mono">No matches</p>
              <p className="text-section-title mt-3">No dogs match those filters yet.</p>
              <ButtonLink href="/report" className="mt-6">
                Report a dog
              </ButtonLink>
            </div>
          )}
        </>
      )}
    </div>
  );
}
