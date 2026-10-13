import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form fields on paper. A `Field` is the label (a wall label), the control,
 * an optional hint and an error line; `Input`, `Textarea` and `Select` are
 * the controls, all on the `input-field` treatment: Paper Card fill, a
 * hairline, 8px corners, the border warming on focus and turning Error when
 * `aria-invalid`.
 */

export interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Id for the error paragraph, so the control can reference it via aria-describedby. */
  errorId?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, errorId, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="label-mono">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL = 'input-field w-full rounded-sm px-3 text-sm';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(CONTROL, 'h-10', className)} {...props} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(CONTROL, 'min-h-28 py-2', className)} {...props} />;
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn(CONTROL, 'h-10', className)} {...props} />;
}
