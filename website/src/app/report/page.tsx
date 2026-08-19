'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IMAGE_MIME_TYPES, validateImage } from '@/lib/validation';

interface FormState {
  status: 'lost' | 'found';
  name: string;
  breed: string;
  color: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

const EMPTY: FormState = {
  status: 'lost',
  name: '',
  breed: '',
  color: '',
  description: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
};

/** Longest edge of the drawn preview, in CSS pixels. */
const PREVIEW_MAX_EDGE = 256;

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export default function ReportPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  /**
   * The preview is decoded and drawn rather than pointed at with an object URL.
   * The browser only ever renders pixels it successfully decoded as an image,
   * there is no URL for anything to navigate to, and there is no object-URL
   * lifetime to leak.
   */
  useEffect(() => {
    const canvas = previewRef.current;
    if (!photo || !canvas) return;

    let cancelled = false;
    createImageBitmap(photo)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close();
          return;
        }
        const scale = Math.min(PREVIEW_MAX_EDGE / bitmap.width, PREVIEW_MAX_EDGE / bitmap.height, 1);
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
      })
      .catch(() => {
        // Undecodable despite passing the type check; the file is still sent and
        // the server validates it again.
      });

    return () => {
      cancelled = true;
    };
  }, [photo]);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFieldErrors((prev) => ({ ...prev, photo: '' }));

    if (!file) {
      setPhoto(null);
      return;
    }

    // The same check the API runs, so the two cannot drift, and the visitor
    // hears about a bad file before uploading it. The `accept` attribute only
    // filters the file picker; it is not a guarantee about what arrives here.
    const rejection = validateImage(file);
    if (rejection) {
      setFieldErrors((prev) => ({ ...prev, photo: rejection }));
      setPhoto(null);
      return;
    }
    setPhoto(file);
  };

  const clearPhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setForm(EMPTY);
    clearPhoto();
    setFieldErrors({});
    setFormError(null);
    setCreatedId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const body = new FormData();
    for (const [key, value] of Object.entries(form)) body.append(key, value);
    if (photo) body.append('photo', photo);

    try {
      const response = await fetch('/api/dogs', { method: 'POST', body });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFieldErrors(payload.fields ?? {});
        setFormError(payload.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setCreatedId(payload.dog?.id ?? null);
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Report published</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Your listing is live. Anyone who recognises the dog can message you through the site — your email address
            is not shown publicly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/dogs/${createdId}`}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              View your listing
            </Link>
            <button
              type="button"
              onClick={reset}
              className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Submit another report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">Report a dog</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The more detail you give, the better the chance of a match. Your email is used only to forward messages — it is
        never shown on the site.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 text-red-700 dark:text-red-300">
            {formError}
          </p>
        )}

        <fieldset>
          <legend className="block text-sm font-medium mb-3">Is this dog lost or found?</legend>
          <div className="flex gap-4">
            {(['lost', 'found'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, status }))}
                aria-pressed={form.status === status}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium capitalize transition-colors ${
                  form.status === status
                    ? status === 'lost'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                      : 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {status} dog
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium mb-2">
            Photo of the dog (optional)
          </label>
          <div
            className={`rounded-lg border-2 border-dashed p-6 text-center ${
              photo ? 'border-orange-300' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            {photo ? (
              <div className="relative inline-block">
                <canvas
                  ref={previewRef}
                  role="img"
                  aria-label={`Preview of ${photo.name}`}
                  className="max-h-64 rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-3">JPEG, PNG, or WebP, up to 5MB.</p>
              </>
            )}
            <input
              ref={fileInputRef}
              id="photo"
              name="photo"
              type="file"
              accept={IMAGE_MIME_TYPES.join(',')}
              onChange={handlePhotoChange}
              className="mx-auto block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-white hover:file:bg-orange-600"
            />
          </div>
          {fieldErrors.photo && (
            <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {fieldErrors.photo}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="name" label="Dog's name (if known)" error={fieldErrors.name}>
            <input id="name" type="text" value={form.name} onChange={update('name')} placeholder="Unknown" className={inputClass} />
          </Field>
          <Field id="breed" label="Breed" error={fieldErrors.breed}>
            <input
              id="breed"
              type="text"
              value={form.breed}
              onChange={update('breed')}
              placeholder="e.g. Golden Retriever, mixed"
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field id="color" label="Colour and markings" error={fieldErrors.color}>
          <input
            id="color"
            type="text"
            value={form.color}
            onChange={update('color')}
            placeholder="e.g. Golden, black with a white chest"
            className={inputClass}
            required
          />
        </Field>

        <Field id="description" label="Description" error={fieldErrors.description}>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={update('description')}
            placeholder="Distinctive features, collar details, behaviour, when they went missing…"
            className={inputClass}
            required
          />
        </Field>

        <Field
          id="address"
          label={form.status === 'lost' ? 'Last seen location' : 'Found location'}
          error={fieldErrors.address}
          hint="A town, park, or street is enough — we place it on the map for you."
        >
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={update('address')}
            placeholder="e.g. Central Park, New York"
            className={inputClass}
            required
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="contactEmail" label="Contact email" error={fieldErrors.contactEmail}>
            <input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={update('contactEmail')}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </Field>
          <Field id="contactPhone" label="Phone number (optional)" error={fieldErrors.contactPhone}>
            <input
              id="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={update('contactPhone')}
              placeholder="555-123-4567"
              className={inputClass}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
