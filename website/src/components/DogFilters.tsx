'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { cn } from '@/lib/cn';
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
 *
 * The status filters are wall-label links with `aria-pressed`, not chips
 * (DESIGN.md → Components → Chips); the pressed one keeps its ink underline.
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
    <div className={cn('flex flex-col gap-5', isPending && 'opacity-70')}>
      <form onSubmit={submitSearch} className="flex gap-2">
        <label htmlFor="dog-search" className="sr-only">
          Search by name, breed, or location
        </label>
        <Input
          // Uncontrolled, keyed on the URL so a back/forward navigation resets it.
          key={activeQuery}
          id="dog-search"
          name="q"
          type="search"
          defaultValue={activeQuery}
          placeholder="Search by name, breed, or location…"
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {FILTERS.map((filter) => {
          const pressed = activeStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              aria-pressed={pressed}
              className={cn(
                'label-mono label-link ink-underline transition-colors duration-150 hover:text-primary',
                pressed && 'text-primary',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
