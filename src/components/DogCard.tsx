import { Dog } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface DogCardProps {
  dog: Dog;
}

export default function DogCard({ dog }: DogCardProps) {
  const statusStyles = {
    lost: 'status-lost',
    found: 'status-found',
    reunited: 'status-reunited',
  };

  const statusLabels = {
    lost: 'Lost',
    found: 'Found',
    reunited: 'Reunited',
  };

  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 w-full">
        <Image
          src={dog.imageUrl}
          alt={`${dog.name} - ${dog.breed}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${statusStyles[dog.status]}`}
        >
          {statusLabels[dog.status]}
        </span>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dog.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{dog.dateReported}</span>
        </div>
        <p className="text-orange-500 font-medium mb-2">{dog.breed}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{dog.description}</p>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {dog.location.address}
        </div>
        <Link
          href={`mailto:${dog.contactEmail}`}
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
