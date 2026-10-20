'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';

interface MessageFormProps {
  /** When set, the message is forwarded to whoever reported that dog. */
  dogId?: string;
  heading: string;
  intro?: string;
  defaultSubject?: string;
  submitLabel: string;
  /** Shown when the API reports the message was emailed on. */
  successTitle: string;
  successBody: string;
  /** Shown when it was stored but nobody was emailed (no mailer configured). */
  savedTitle?: string;
  savedBody: string;
}

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

export default function MessageForm({
  dogId,
  heading,
  intro,
  defaultSubject = '',
  submitLabel,
  successTitle,
  successBody,
  savedTitle = 'Message saved',
  savedBody,
}: MessageFormProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY, subject: defaultSubject });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** The API's own account of what happened; the success copy follows it. */
  const [sent, setSent] = useState<{ delivered: boolean } | null>(null);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  /** aria-invalid / aria-describedby for a control whose error line Field renders. */
  const describe = (key: keyof FormState) =>
    fieldErrors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `message-${key}-error` } : {};

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, dogId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFieldErrors(payload.fields ?? {});
        setFormError(payload.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSent({ delivered: Boolean(payload.delivered) });
      setForm({ ...EMPTY, subject: defaultSubject });
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div>
        <p className="label-mono text-success">{sent.delivered ? 'Sent' : 'Saved'}</p>
        <h2 className="text-card-title mt-2">{sent.delivered ? successTitle : savedTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{sent.delivered ? successBody : savedBody}</p>
        <Button type="button" variant="secondary" className="mt-6" onClick={() => setSent(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <p className="label-mono">Get in touch</p>
        <h2 className="text-card-title mt-2">{heading}</h2>
        {intro && <p className="mt-2 text-sm text-muted-foreground">{intro}</p>}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="message-name" error={fieldErrors.name} errorId="message-name-error">
          <Input
            id="message-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={update('name')}
            required
            {...describe('name')}
          />
        </Field>
        <Field label="Your email" htmlFor="message-email" error={fieldErrors.email} errorId="message-email-error">
          <Input
            id="message-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            required
            {...describe('email')}
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="message-subject" error={fieldErrors.subject} errorId="message-subject-error">
        <Input
          id="message-subject"
          type="text"
          value={form.subject}
          onChange={update('subject')}
          required
          {...describe('subject')}
        />
      </Field>

      <Field label="Message" htmlFor="message-body" error={fieldErrors.message} errorId="message-message-error">
        <Textarea
          id="message-body"
          rows={5}
          value={form.message}
          onChange={update('message')}
          required
          {...describe('message')}
        />
      </Field>

      <div>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Sending…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
