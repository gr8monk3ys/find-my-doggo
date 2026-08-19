'use client';

import { useState } from 'react';

interface MessageFormProps {
  /** When set, the message is forwarded to whoever reported that dog. */
  dogId?: string;
  heading: string;
  intro?: string;
  defaultSubject?: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
}

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export default function MessageForm({
  dogId,
  heading,
  intro,
  defaultSubject = '',
  submitLabel,
  successTitle,
  successBody,
}: MessageFormProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY, subject: defaultSubject });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

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
      setSent(true);
      setForm({ ...EMPTY, subject: defaultSubject });
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-6">
        <h2 className="text-xl font-bold mb-2">{successTitle}</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{successBody}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{heading}</h2>
        {intro && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{intro}</p>}
      </div>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 text-red-700 dark:text-red-300">
          {formError}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="message-name" label="Your name" error={fieldErrors.name}>
          <input id="message-name" type="text" value={form.name} onChange={update('name')} className={inputClass} required />
        </Field>
        <Field id="message-email" label="Your email" error={fieldErrors.email}>
          <input
            id="message-email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field id="message-subject" label="Subject" error={fieldErrors.subject}>
        <input
          id="message-subject"
          type="text"
          value={form.subject}
          onChange={update('subject')}
          className={inputClass}
          required
        />
      </Field>

      <Field id="message-body" label="Message" error={fieldErrors.message}>
        <textarea
          id="message-body"
          rows={5}
          value={form.message}
          onChange={update('message')}
          className={inputClass}
          required
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
