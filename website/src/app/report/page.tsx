'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import type { Dog } from '@/lib/types';
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

export default function ReportPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<Dog | null>(null);
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

  /** aria-invalid / aria-describedby for a control whose error line Field renders. */
  const describe = (key: string) =>
    fieldErrors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `${key}-error` } : {};

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
    setCreated(null);
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
      setCreated(payload.dog ?? null);
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (created) {
    // The API says whether the address resolved to coordinates; the copy follows
    // it rather than promising a pin we may not have placed.
    const onMap = created.location.lat !== null && created.location.lng !== null;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <p className="label-mono text-success">Published</p>
        <h2 className="text-page-title mt-3">Report published</h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {onMap
            ? 'Your listing is live and it is on the map. '
            : `Your listing is live. We could not place “${created.location.address}” on the map, so it appears under “Not on the map” on the map page. `}
          Anyone who recognises the dog can message you through the site — your email address is not shown publicly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={`/dogs/${created.id}`}>View your listing</ButtonLink>
          <Button type="button" variant="secondary" onClick={reset}>
            Submit another report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-2xl">
        <p className="label-mono">New listing</p>
        <h1 className="text-page-title mt-3">Report a dog</h1>
        <p className="mt-4 text-muted-foreground">
          The more detail you give, the better the chance of a match. Your email is used only to forward messages — it
          is never shown on the site.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-10 flex max-w-2xl flex-col gap-8">
        {formError && (
          <p
            role="alert"
            className="rounded-sm border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <fieldset>
          <legend className="label-mono">Is this dog lost or found?</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(['lost', 'found'] as const).map((status) => {
              const pressed = form.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, status }))}
                  aria-pressed={pressed}
                  className={cn(
                    'h-12 rounded-lg border px-4 text-sm font-medium capitalize transition-colors duration-150',
                    pressed
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/45 hover:text-primary',
                  )}
                >
                  {status} dog
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Photo of the dog (optional)" htmlFor="photo" error={fieldErrors.photo} errorId="photo-error">
          <div className="rounded-sm border border-dashed border-border bg-card p-5">
            {photo ? (
              <div className="flex flex-col items-start gap-3">
                <canvas ref={previewRef} role="img" aria-label={`Preview of ${photo.name}`} className="plate max-h-64" />
                <Button type="button" variant="ghost" size="sm" onClick={clearPhoto}>
                  Remove photo
                </Button>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">JPEG, PNG, or WebP, up to 5MB.</p>
            )}
            <input
              ref={fileInputRef}
              id="photo"
              name="photo"
              type="file"
              accept={IMAGE_MIME_TYPES.join(',')}
              onChange={handlePhotoChange}
              className={cn(
                'block w-full text-sm text-muted-foreground',
                'file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:border-primary/45 hover:file:text-primary',
                photo && 'mt-4',
              )}
              {...describe('photo')}
            />
          </div>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Dog's name (if known)" htmlFor="name" error={fieldErrors.name} errorId="name-error">
            <Input
              id="name"
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Unknown"
              {...describe('name')}
            />
          </Field>
          <Field label="Breed" htmlFor="breed" error={fieldErrors.breed} errorId="breed-error">
            <Input
              id="breed"
              type="text"
              value={form.breed}
              onChange={update('breed')}
              placeholder="e.g. Golden Retriever, mixed"
              required
              {...describe('breed')}
            />
          </Field>
        </div>

        <Field label="Colour and markings" htmlFor="color" error={fieldErrors.color} errorId="color-error">
          <Input
            id="color"
            type="text"
            value={form.color}
            onChange={update('color')}
            placeholder="e.g. Golden, black with a white chest"
            required
            {...describe('color')}
          />
        </Field>

        <Field label="Description" htmlFor="description" error={fieldErrors.description} errorId="description-error">
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={update('description')}
            placeholder="Distinctive features, collar details, behaviour, when they went missing…"
            required
            {...describe('description')}
          />
        </Field>

        <Field
          label={form.status === 'lost' ? 'Last seen location' : 'Found location'}
          htmlFor="address"
          hint="A town, park, or street is enough — we try to place it on the map for you."
          error={fieldErrors.address}
          errorId="address-error"
        >
          <Input
            id="address"
            type="text"
            value={form.address}
            onChange={update('address')}
            placeholder="e.g. Central Park, New York"
            required
            {...describe('address')}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Contact email" htmlFor="contactEmail" error={fieldErrors.contactEmail} errorId="contactEmail-error">
            <Input
              id="contactEmail"
              type="email"
              autoComplete="email"
              value={form.contactEmail}
              onChange={update('contactEmail')}
              placeholder="you@example.com"
              required
              {...describe('contactEmail')}
            />
          </Field>
          <Field
            label="Phone number (optional)"
            htmlFor="contactPhone"
            error={fieldErrors.contactPhone}
            errorId="contactPhone-error"
          >
            <Input
              id="contactPhone"
              type="tel"
              autoComplete="tel"
              value={form.contactPhone}
              onChange={update('contactPhone')}
              placeholder="555-123-4567"
              {...describe('contactPhone')}
            />
          </Field>
        </div>

        <div className="border-t border-border pt-8">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
