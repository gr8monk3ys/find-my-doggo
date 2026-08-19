import type { DogStatus } from '@/lib/types';

const STYLES: Record<DogStatus, string> = {
  lost: 'status-lost',
  found: 'status-found',
  reunited: 'status-reunited',
};

const LABELS: Record<DogStatus, string> = {
  lost: 'Lost',
  found: 'Found',
  reunited: 'Reunited',
};

export default function StatusBadge({ status, className = '' }: { status: DogStatus; className?: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STYLES[status]} ${className}`}>
      {LABELS[status]}
    </span>
  );
}
