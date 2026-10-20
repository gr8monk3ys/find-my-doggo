import Link from 'next/link';
import DogCard from '@/components/DogCard';
import { ButtonLink } from '@/components/ui/button';
import { countByStatus, listDogs } from '@/lib/dogs';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    title: 'Upload a photo',
    body: 'Take a clear photo of the lost or found dog and add it to your report.',
  },
  {
    title: 'Add a location',
    body: 'Type where the dog was last seen. We try to place it on the map for you.',
  },
  {
    title: 'Get in touch',
    body: 'Anyone who recognises the dog can message you without your email being published.',
  },
];

const CONTAINER = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

export default async function Home() {
  // Real numbers or none at all — an empty board is honest, invented totals are not.
  const [recentDogs, counts] = await Promise.all([
    listDogs({ limit: 3 }).catch(() => []),
    countByStatus().catch(() => ({ lost: 0, found: 0, reunited: 0 })),
  ]);

  const active = counts.lost + counts.found;
  const stats = [
    { value: counts.reunited, label: counts.reunited === 1 ? 'Dog reunited' : 'Dogs reunited' },
    { value: active, label: active === 1 ? 'Active listing' : 'Active listings' },
    { value: counts.found, label: counts.found === 1 ? 'Dog found' : 'Dogs found' },
  ];

  return (
    <div>
      {/* Masthead: the one primary button on the page lives here. */}
      <section className={`${CONTAINER} py-16 sm:py-20 lg:py-24`}>
        <p className="label-mono">A community noticeboard for lost &amp; found dogs</p>
        <h1 className="text-display mt-5 max-w-4xl">Help reunite lost dogs with their families</h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
          Post a lost or found dog with a photo and a location. Anyone nearby can search the listings, see the map,
          and reach you directly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/report" size="lg">
            Report a dog
          </ButtonLink>
          <ButtonLink href="/dogs" variant="secondary" size="lg">
            Browse listings
          </ButtonLink>
        </div>
      </section>

      <hr className="gallery-rule" />

      {/* The board today: three counts, label before numeral. */}
      <section className={`${CONTAINER} py-10 sm:py-12`} aria-labelledby="board-today">
        <h2 id="board-today" className="sr-only">
          The board today
        </h2>
        <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="py-5 sm:py-0 sm:pr-8 sm:pl-8 sm:first:pl-0 sm:last:pr-0">
              <dt className="label-mono">{stat.label}</dt>
              <dd className="text-page-title mt-2 text-foreground">{stat.value.toLocaleString('en-US')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <hr className="gallery-rule" />

      {/* How it works: numbered rows divided by hairlines, not feature tiles. */}
      <section className={`${CONTAINER} py-16 sm:py-20`}>
        <p className="label-mono">How it works</p>
        <h2 className="text-section-title mt-3">Three steps from a photo to a phone call</h2>
        <ol className="mt-8 max-w-3xl border-t border-border">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid gap-2 border-b border-border py-5 sm:grid-cols-[6rem_1fr] sm:gap-6">
              <span className="label-mono pt-1">Step {String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-subsection">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <hr className="gallery-rule" />

      {/* Recent listings: the gallery, or an honest empty board. */}
      <section className={`${CONTAINER} py-16 sm:py-20`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono">From the board</p>
            <h2 className="text-section-title mt-3">Recent listings</h2>
          </div>
          <Link href="/dogs" className="ink-underline label-link text-sm font-medium text-primary">
            View all listings
          </Link>
        </div>
        {recentDogs.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentDogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border-t border-border pt-8">
            <p className="label-mono">Nothing posted yet</p>
            <p className="text-card-title mt-3 max-w-xl">The board is empty. The first listing could be yours.</p>
            <ButtonLink href="/report" variant="secondary" className="mt-6">
              Post the first listing
            </ButtonLink>
          </div>
        )}
      </section>

      <hr className="gallery-rule" />

      <section className={`${CONTAINER} py-16 sm:py-20`}>
        <p className="label-mono">Seen a dog?</p>
        <h2 className="text-section-title mt-3 max-w-2xl">Have you seen a lost dog?</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          If you&apos;ve found a dog or spotted one that looks lost, please report it. Your quick action could help
          reunite a family with their dog.
        </p>
        <ButtonLink href="/report" variant="secondary" size="lg" className="mt-8">
          Report now
        </ButtonLink>
      </section>
    </div>
  );
}
