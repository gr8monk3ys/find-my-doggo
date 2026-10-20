import Image from 'next/image';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatReportedDate } from '@/lib/format';
import type { Dog } from '@/lib/types';

/**
 * One sheet on the noticeboard: the photograph pasted on as a square plate,
 * the name written large in Fraunces, and beneath it the facts as one mono
 * catalogue line — breed · status · date. Hover turns the name Terracotta and
 * warms the plate's hairline; nothing lifts (DESIGN.md → Photo Plate).
 */
export default function DogCard({ dog }: { dog: Dog }) {
  return (
    <Link href={`/dogs/${dog.id}`} className="group block">
      <div className="plate relative aspect-square w-full group-hover:border-primary/45">
        {dog.imageUrl ? (
          <Image
            src={dog.imageUrl}
            alt={`${dog.name}, a ${dog.color} ${dog.breed}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // No photograph: the tinted plate with the dog's initial in the ink.
          <div className="flex h-full items-center justify-center" aria-hidden="true">
            <span className="text-display text-primary">{dog.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-card-title text-foreground transition-colors duration-150 group-hover:text-primary">
          {dog.name}
        </h3>
        <p className="label-mono mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{dog.breed}</span>
          <span aria-hidden="true">·</span>
          <StatusBadge status={dog.status} />
          <span aria-hidden="true">·</span>
          <time dateTime={dog.dateReported}>{formatReportedDate(dog.dateReported)}</time>
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{dog.description}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{dog.location.address}</p>
        <span className="ink-underline mt-3 inline-block text-sm font-medium text-primary">View details</span>
      </div>
    </Link>
  );
}
