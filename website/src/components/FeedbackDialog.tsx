'use client';

import {
  createContext,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { cn } from '@/lib/cn';

/**
 * The beta tester's one obvious place to say what broke. A native <dialog>
 * opened with showModal(), so Escape, focus trapping and the top layer come
 * from the browser; the scrim is `overlay-scrim` on ::backdrop (DESIGN.md →
 * Elevation → The Scrim Rule) and the sheet is card paper with a hairline.
 *
 * One dialog is mounted by <FeedbackProvider> in the root layout; any number
 * of <FeedbackTrigger>s (header, footer) open it through context, and focus
 * returns to whichever one did.
 */

const BETA_LABEL = 'Private beta';
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

type OpenFeedback = (trigger: HTMLElement | null) => void;

const FeedbackContext = createContext<OpenFeedback | null>(null);

type Outcome = { delivered: boolean } | null;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback<OpenFeedback>((trigger) => {
    triggerRef.current = trigger;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <FeedbackContext.Provider value={open}>
      {children}
      <FeedbackDialog ref={dialogRef} triggerRef={triggerRef} />
    </FeedbackContext.Provider>
  );
}

export type FeedbackTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** A plain <button> that opens the dialog. Style it like the link it sits among. */
export function FeedbackTrigger({ children = 'Feedback', onClick, className, ...props }: FeedbackTriggerProps) {
  const open = useContext(FeedbackContext);
  return (
    <button
      type="button"
      className={className}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        open?.(event.currentTarget);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

interface FeedbackDialogProps {
  ref: React.RefObject<HTMLDialogElement | null>;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function FeedbackDialog({ ref, triggerRef }: FeedbackDialogProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const close = () => ref.current?.close();

  /** Native `close` fires on Escape, on close(), and on a backdrop click below. */
  const handleClose = () => {
    if (outcome) {
      // A sent note is done with; the next opening starts clean.
      setMessage('');
      setEmail('');
      setOutcome(null);
    }
    setFieldErrors({});
    setFormError(null);
    triggerRef.current?.focus();
  };

  /** The sheet fills the dialog box, so a click whose target is the dialog itself landed on the backdrop. */
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  const describe = (key: 'message' | 'email') =>
    fieldErrors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `feedback-${key}-error` } : {};

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: window.location.pathname, message, email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFieldErrors(payload.fields ?? {});
        setFormError(payload.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setOutcome({ delivered: Boolean(payload.delivered) });
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onClick={handleBackdropClick}
      aria-labelledby="feedback-title"
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-card p-0 text-foreground',
        'backdrop:overlay-scrim',
      )}
    >
      {outcome ? (
        <div className="p-6 sm:p-8">
          <p className="label-mono text-success">{BETA_LABEL}</p>
          <h2 id="feedback-title" className="text-card-title mt-2">
            {outcome.delivered ? 'Thanks — saved and emailed' : 'Thanks — saved'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {outcome.delivered
              ? 'Your note is on its way to us.'
              : 'Your note is saved and we read every one. Email delivery is not set up on this deployment yet, so it may take a little longer to be seen.'}
          </p>
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <p className="label-mono">{BETA_LABEL}</p>
            <h2 id="feedback-title" className="text-card-title mt-2">
              What broke, or what would help?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us what happened on this page. The address you are on is sent with the note.
            </p>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-sm border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <Field
            label="Your feedback"
            htmlFor="feedback-message"
            error={fieldErrors.message}
            errorId="feedback-message-error"
          >
            <Textarea
              id="feedback-message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={MESSAGE_MIN}
              maxLength={MESSAGE_MAX}
              required
              {...describe('message')}
            />
          </Field>

          <Field
            label="Email (optional)"
            htmlFor="feedback-email"
            hint="Only if you would like a reply."
            error={fieldErrors.email}
            errorId="feedback-email-error"
          >
            <Input
              id="feedback-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              {...describe('email')}
            />
          </Field>

          <div className="mt-1 flex flex-wrap-reverse justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send feedback'}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
