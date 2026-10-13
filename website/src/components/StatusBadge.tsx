import type { DogStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

/**
 * Status is metadata, not a chip (DESIGN.md → Colors → The Status Label
 * Rule): a mono wall label in the matching signal token. Lost is Error,
 * found is Success, reunited is Info. Never a coloured pill over the photo.
 */
const TONE: Record<DogStatus, string> = {
  lost: 'text-destructive',
  found: 'text-success',
  reunited: 'text-info',
};

const LABELS: Record<DogStatus, string> = {
  lost: 'Lost',
  found: 'Found',
  reunited: 'Reunited',
};

export default function StatusBadge({ status, className }: { status: DogStatus; className?: string }) {
  return <span className={cn('label-mono', TONE[status], className)}>{LABELS[status]}</span>;
}
