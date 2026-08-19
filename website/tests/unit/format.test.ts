import { describe, expect, it } from 'vitest';
import { formatReportedDate } from '@/lib/format';

describe('formatReportedDate', () => {
  it('renders an ISO timestamp as a short date', () => {
    expect(formatReportedDate('2024-01-15T10:30:00.000Z')).toBe('Jan 15, 2024');
  });

  it('does not shift the day across timezones', () => {
    expect(formatReportedDate('2024-01-15T23:59:00.000Z')).toBe('Jan 15, 2024');
  });

  it('returns an empty string for an unparseable value', () => {
    expect(formatReportedDate('not a date')).toBe('');
  });
});
