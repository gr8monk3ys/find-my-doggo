import Link from 'next/link';
import DogCard from '@/components/DogCard';
import { countByStatus, listDogs } from '@/lib/dogs';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: '📷',
    title: '1. Upload a photo',
    body: 'Take a clear photo of the lost or found dog and add it to your report.',
  },
  {
    icon: '📍',
    title: '2. Add a location',
    body: 'Type where the dog was last seen. We place it on the map for you.',
  },
  {
    icon: '✉️',
    title: '3. Get in touch',
    body: 'Anyone who recognises the dog can message you without your email being published.',
  },
];

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
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Help reunite lost dogs
              <br />
              with their families
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Post a lost or found dog with a photo and a location. Anyone nearby can search the listings, see the
              map, and reach you directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/report"
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Report a dog
              </Link>
              <Link
                href="/dogs"
                className="bg-orange-700 hover:bg-orange-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-[#0a0a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6">
                <div className="text-4xl font-bold text-orange-500 mb-2">{stat.value.toLocaleString('en-US')}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.title} className="text-center p-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-[#0a0a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent listings</h2>
            <Link href="/dogs" className="text-orange-500 hover:text-orange-600 font-medium">
              View all →
            </Link>
          </div>
          {recentDogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No listings yet.{' '}
              <Link href="/report" className="text-orange-500 hover:text-orange-600 font-medium">
                Be the first to post one.
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Have you seen a lost dog?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            If you&apos;ve found a dog or spotted one that looks lost, please report it. Your quick action could help
            reunite a family with their dog.
          </p>
          <Link
            href="/report"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Report now
          </Link>
        </div>
      </section>
    </div>
  );
}
