import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MessageForm from '@/components/MessageForm';
import StatusBadge from '@/components/StatusBadge';
import { getDog } from '@/lib/dogs';
import { formatReportedDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dog = await getDog(id).catch(() => null);
  if (!dog) return { title: 'Listing not found' };

  return {
    title: `${dog.name} — ${dog.status} ${dog.breed}`,
    description: `${dog.description} Reported near ${dog.location.address}.`,
    openGraph: dog.imageUrl ? { images: [dog.imageUrl] } : undefined,
  };
}

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dog = await getDog(id).catch(() => null);
  if (!dog) notFound();

  const detailRows = [
    { label: 'Breed', value: dog.breed },
    { label: 'Colour and markings', value: dog.color },
    { label: dog.status === 'lost' ? 'Last seen' : 'Found near', value: dog.location.address },
    { label: 'Reported', value: formatReportedDate(dog.dateReported) },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/dogs" className="text-orange-500 hover:text-orange-600 font-medium">
        ← Back to listings
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1a1a2e]">
            {dog.imageUrl ? (
              <Image
                src={dog.imageUrl}
                alt={`${dog.name}, a ${dog.color} ${dog.breed}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl" aria-hidden="true">
                🐕
              </div>
            )}
          </div>
          {dog.location.lat !== null && dog.location.lng !== null && (
            <Link
              href={`/map?status=${dog.status}`}
              className="mt-4 inline-block text-orange-500 hover:text-orange-600 font-medium"
            >
              See this area on the map →
            </Link>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold">{dog.name}</h1>
            <StatusBadge status={dog.status} />
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{dog.description}</p>

          <dl className="space-y-3 mb-8">
            {detailRows.map((row) => (
              <div key={row.label} className="flex gap-3 text-sm">
                <dt className="w-40 shrink-0 text-gray-500 dark:text-gray-400">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>

          {dog.status === 'reunited' ? (
            <p className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-4 text-blue-800 dark:text-blue-200">
              Good news — this dog is already back home. No need to get in touch.
            </p>
          ) : (
            <MessageForm
              dogId={dog.id}
              heading={`Message the person who reported ${dog.name}`}
              intro="Your message is forwarded to them. Their email address is never shown publicly."
              defaultSubject={`About ${dog.name} (${dog.breed})`}
              submitLabel="Send message"
              successTitle="Message sent"
              successBody="We've passed your message on. If they reply, it will come straight to your inbox."
            />
          )}
        </div>
      </div>
    </div>
  );
}
