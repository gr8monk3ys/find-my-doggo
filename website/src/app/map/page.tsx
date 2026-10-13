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

/**
 * The legend mirrors the three pin fills drawn in globals.css: lost is a
 * filled ink disc, found a paper disc with an ink ring, reunited a tinted
 * disc with a muted ring.
 */
const LEGEND: { status: DogStatus; dot: string; label: string }[] = [
  { status: 'lost', dot: 'border-primary bg-primary', label: 'Lost dogs' },
  { status: 'found', dot: 'border-primary bg-card', label: 'Found dogs' },
  { status: 'reunited', dot: 'border-muted-foreground/55 bg-muted', label: 'Reunited' },
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-2xl">
        <p className="label-mono">Where they were seen</p>
        <h1 className="text-page-title mt-3">Map</h1>
        <p className="mt-4 text-muted-foreground">
          Every listing with a recognisable location is plotted here. Click a pin to open the listing.
        </p>
      </header>

      <div className="mt-10">
        <DogFilters basePath="/map" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
        <figure className="min-w-0">
          {/* The tile attribution inside the map is the only "OpenStreetMap" text on the page; the e2e suite looks for it. */}
          <figcaption className="label-mono mb-3">
            {pinned.length} {pinned.length === 1 ? 'pin' : 'pins'} · click a pin to open the listing
          </figcaption>
          <DogMap dogs={pinned} />
          {pinned.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nothing to plot for these filters yet.</p>}
        </figure>

        <aside className="flex flex-col gap-10">
          <section>
            <p className="label-mono">On the map</p>
            <h2 className="text-card-title mt-2">
              {pinned.length} {pinned.length === 1 ? 'dog' : 'dogs'} on the map
            </h2>
            <ul className="mt-4 max-h-[400px] overflow-y-auto border-t border-border">
              {pinned.map((dog) => (
                <li key={dog.id}>
                  <Link href={`/dogs/${dog.id}`} className="group flex flex-col gap-1 border-b border-border py-3">
                    <span className="label-mono flex flex-wrap items-center gap-x-2">
                      <span>{dog.breed}</span>
                      <span aria-hidden="true">·</span>
                      <StatusBadge status={dog.status} />
                    </span>
                    <span className="font-medium text-foreground transition-colors duration-150 group-hover:text-primary">
                      {dog.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{dog.location.address}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {unpinned.length > 0 && (
            <section>
              <p className="label-mono">Not on the map</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn&apos;t resolve a location for {unpinned.length === 1 ? 'this listing' : 'these listings'}.
              </p>
              <ul className="mt-3 border-t border-border">
                {unpinned.map((dog) => (
                  <li key={dog.id} className="border-b border-border py-3 text-sm">
                    <Link href={`/dogs/${dog.id}`} className="ink-underline font-medium text-foreground hover:text-primary">
                      {dog.name}
                    </Link>
                    <span className="text-muted-foreground"> — {dog.location.address}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <p className="label-mono">Legend</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {LEGEND.map((item) => (
                <li key={item.status} className="flex items-center gap-3">
                  <span className={`size-4 shrink-0 rounded-full border-2 ${item.dot}`} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
