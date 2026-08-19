import { describe, expect, it } from 'vitest';
import { fieldErrors, IMAGE_MAX_BYTES, messageSchema, reportSchema, validateImage } from '@/lib/validation';

const VALID_REPORT = {
  name: '  Max  ',
  breed: 'Golden Retriever',
  color: 'Golden',
  description: 'Friendly golden retriever wearing a blue collar, last seen near the lake.',
  status: 'lost',
  address: 'Central Park, New York',
  contactEmail: '  Owner@Example.COM ',
  contactPhone: ' 555-0101 ',
};

describe('reportSchema', () => {
  it('trims text and normalises the contact email', () => {
    const result = reportSchema.parse(VALID_REPORT);
    expect(result.name).toBe('Max');
    expect(result.contactEmail).toBe('owner@example.com');
    expect(result.contactPhone).toBe('555-0101');
  });

  it('defaults a missing name to Unknown, since found dogs rarely have one', () => {
    expect(reportSchema.parse({ ...VALID_REPORT, name: '   ' }).name).toBe('Unknown');
    const { name: _omitted, ...withoutName } = VALID_REPORT;
    void _omitted;
    expect(reportSchema.parse(withoutName).name).toBe('Unknown');
  });

  it('drops an empty optional phone rather than storing an empty string', () => {
    expect(reportSchema.parse({ ...VALID_REPORT, contactPhone: '  ' }).contactPhone).toBeUndefined();
  });

  it('rejects a description too short to identify a dog', () => {
    const result = reportSchema.safeParse({ ...VALID_REPORT, description: 'brown' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = reportSchema.safeParse({ ...VALID_REPORT, contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(Object.keys(fieldErrors(result.error!))).toContain('contactEmail');
  });

  it('rejects a status the app does not accept from the public form', () => {
    expect(reportSchema.safeParse({ ...VALID_REPORT, status: 'reunited' }).success).toBe(false);
  });
});

describe('messageSchema', () => {
  const VALID_MESSAGE = {
    name: 'Sam',
    email: 'sam@example.com',
    subject: 'I think I saw Max',
    message: 'I saw a dog matching this description near the north gate this morning.',
  };

  it('accepts a message without a dog id', () => {
    expect(messageSchema.safeParse(VALID_MESSAGE).success).toBe(true);
  });

  it('rejects a message body too short to be useful', () => {
    expect(messageSchema.safeParse({ ...VALID_MESSAGE, message: 'hi' }).success).toBe(false);
  });
});

describe('validateImage', () => {
  const file = (bytes: number, type: string) =>
    new File([new Uint8Array(bytes)], 'photo', { type });

  it('accepts a small JPEG', () => {
    expect(validateImage(file(1024, 'image/jpeg'))).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(validateImage(file(0, 'image/jpeg'))).toMatch(/empty/i);
  });

  it('rejects a file over the size limit', () => {
    expect(validateImage(file(IMAGE_MAX_BYTES + 1, 'image/png'))).toMatch(/5MB or smaller/);
  });

  it('rejects a non-image mime type', () => {
    expect(validateImage(file(1024, 'application/pdf'))).toMatch(/JPEG, PNG, or WebP/);
  });
});

describe('fieldErrors', () => {
  it('keeps the first message per field and keys it by path', () => {
    const result = reportSchema.safeParse({ ...VALID_REPORT, breed: '', color: '' });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(errors).toHaveProperty('breed');
    expect(errors).toHaveProperty('color');
  });
});
