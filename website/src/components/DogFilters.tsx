'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { DogStatus } from '@/lib/types';

const FILTERS: { value: 'all' | DogStatus; label: string }[] = [
  { value: 'all', label: 'All dogs' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'reunited', label: 'Reunited' },
];

/**
 * Filter state lives in the URL rather than component state so a search can be
 * shared or bookmarked, and so filtering happens in SQL instead of over a
 * fully-downloaded list.
 */
export default function DogFilters({ basePath = '/dogs' }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeStatus = searchParams.get('status') ?? 'all';
  const activeQuery = searchParams.get('q') ?? '';

  const navigate = (next: URLSearchParams) => {
    const queryString = next.toString();
    startTransition(() => router.push(queryString ? `${basePath}?${queryString}` : basePath));
  };

  const setStatus = (status: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (status === 'all') next.delete('status');
    else next.set('status', status);
    navigate(next);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    const trimmed = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    navigate(next);
  };

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-70' : ''}`}>
      <form onSubmit={submitSearch} className="flex gap-2">
        <label htmlFor="dog-search" className="sr-only">
          Search by name, breed, or location
        </label>
        <input
          // Uncontrolled, keyed on the URL so a back/forward navigation resets it.
          key={activeQuery}
          id="dog-search"
          name="q"
          type="search"
          defaultValue={activeQuery}
          placeholder="Search by name, breed, or location…"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            aria-pressed={activeStatus === filter.value}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeStatus === filter.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
