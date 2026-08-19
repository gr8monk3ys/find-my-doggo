import { z } from 'zod';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const reportSchema = z.object({
  // Reporters often do not know a found dog's name, so this is optional and
  // normalised to "Unknown" rather than rejected.
  name: z.string().trim().max(60).optional().transform((v) => (v ? v : 'Unknown')),
  breed: trimmed(2, 60),
  color: trimmed(2, 60),
  description: trimmed(10, 2000),
  status: z.enum(['lost', 'found']),
  address: trimmed(3, 200),
  contactEmail: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(254)),
  contactPhone: z.string().trim().max(30).optional().transform((v) => v || undefined),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const messageSchema = z.object({
  name: trimmed(1, 80),
  email: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(254)),
  subject: trimmed(3, 150),
  message: trimmed(10, 5000),
  dogId: z.string().trim().max(64).optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Validates an uploaded photo. Returns an error string rather than throwing so
 * callers can fold it into the same field-error shape as the zod issues.
 */
export function validateImage(file: File): string | null {
  if (file.size === 0) return 'The uploaded photo is empty.';
  if (file.size > IMAGE_MAX_BYTES) {
    return `Photo must be ${Math.floor(IMAGE_MAX_BYTES / 1024 / 1024)}MB or smaller.`;
  }
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'Photo must be a JPEG, PNG, or WebP image.';
  }
  return null;
}

/** Flattens zod issues into `{ field: message }` for rendering next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
