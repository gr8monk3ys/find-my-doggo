import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCAL_UPLOAD_DIR, resolveLocalUpload } from '@/lib/storage';

describe('resolveLocalUpload', () => {
  it('accepts a name this module could have generated', () => {
    const resolved = resolveLocalUpload('6f2610ef-daca-4eeb-a217-a50298d0909c.png');
    expect(resolved?.contentType).toBe('image/png');
    expect(resolved?.path).toBe(path.join(LOCAL_UPLOAD_DIR, '6f2610ef-daca-4eeb-a217-a50298d0909c.png'));
  });

  it('maps each allowed extension to its content type', () => {
    expect(resolveLocalUpload('6f2610ef-daca-4eeb-a217-a50298d0909c.jpg')?.contentType).toBe('image/jpeg');
    expect(resolveLocalUpload('6f2610ef-daca-4eeb-a217-a50298d0909c.webp')?.contentType).toBe('image/webp');
  });

  it('refuses path traversal and anything not UUID-shaped', () => {
    for (const name of [
      '../../../etc/passwd',
      '..%2F..%2Fetc%2Fpasswd',
      'not-a-uuid.png',
      '6f2610ef-daca-4eeb-a217-a50298d0909c.svg',
      '6f2610ef-daca-4eeb-a217-a50298d0909c.png/../../secret',
      '',
    ]) {
      expect(resolveLocalUpload(name)).toBeNull();
    }
  });
});
