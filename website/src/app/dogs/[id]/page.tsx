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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link href="/dogs" className="ink-underline label-link text-sm font-medium text-primary">
        ← Back to listings
      </Link>

      {/* An asymmetric editorial split: the sheet's text at the left, the plate at the right edge. */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div className="lg:order-last">
          <div className="plate relative aspect-square w-full">
            {dog.imageUrl ? (
              <Image
                src={dog.imageUrl}
                alt={`${dog.name}, a ${dog.color} ${dog.breed}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center" aria-hidden="true">
                <span className="text-display text-primary">{dog.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          {dog.location.lat !== null && dog.location.lng !== null && (
            <Link
              href={`/map?status=${dog.status}`}
              className="ink-underline label-link mt-4 text-sm font-medium text-primary"
            >
              See this area on the map →
            </Link>
          )}
        </div>

        <div>
          <p className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={dog.status} />
            <span aria-hidden="true">·</span>
            <span>{dog.breed}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={dog.dateReported}>{formatReportedDate(dog.dateReported)}</time>
          </p>
          <h1 className="text-page-title mt-3">{dog.name}</h1>
          <p className="mt-5 max-w-prose text-lg text-pretty">{dog.description}</p>

          <dl className="mt-8 max-w-prose border-t border-border">
            {detailRows.map((row) => (
              <div key={row.label} className="grid gap-1 border-b border-border py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <dt className="label-mono sm:pt-1">{row.label}</dt>
                <dd className="text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 max-w-prose">
            {dog.status === 'reunited' ? (
              <div>
                <p className="label-mono text-info">Reunited</p>
                <p className="text-card-title mt-2">Good news — this dog is already back home.</p>
                <p className="mt-2 text-sm text-muted-foreground">No need to get in touch.</p>
              </div>
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
    </div>
  );
}
