import Image from 'next/image';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import type { Dog } from '@/lib/types';
import { formatReportedDate } from '@/lib/format';

export default function DogCard({ dog }: { dog: Dog }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="group block bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
        {dog.imageUrl ? (
          <Image
            src={dog.imageUrl}
            alt={`${dog.name}, a ${dog.color} ${dog.breed}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
            🐕
          </div>
        )}
        <StatusBadge status={dog.status} className="absolute top-3 right-3" />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dog.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
            {formatReportedDate(dog.dateReported)}
          </span>
        </div>
        <p className="text-orange-500 font-medium mb-2">{dog.breed}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{dog.description}</p>
        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{dog.location.address}</span>
        </p>
        <span className="mt-4 inline-block font-medium text-orange-500 group-hover:text-orange-600">
          View details →
        </span>
      </div>
    </Link>
  );
}
