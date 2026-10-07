import { cn } from '@/lib/utils/cn';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type Invalid = { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Invalid>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn('field', invalid && 'field-invalid', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn('field resize-y min-h-[5.5rem]', invalid && 'field-invalid', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Invalid>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn('field-select', invalid && 'field-invalid', className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

interface FieldProps {
  label: ReactNode;
  /** Help text under the control. Replaced by `error` when present. */
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Marker appended to required labels, e.g. "*" — visually only. */
  requiredMark?: string;
  className?: string;
  /** A single form control; it receives `id`, `aria-describedby`, `invalid`. */
  children: ReactElement;
}

/**
 * Label + control + hint/error, wired for assistive tech: the label targets
 * the control, and the hint or error is linked through `aria-describedby`.
 */
export function Field({ label, hint, error, required, requiredMark = '*', className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error || hint;

  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        id: (children.props.id as string | undefined) ?? id,
        'aria-describedby': message ? messageId : undefined,
        invalid: !!error,
        required,
      })
    : children;

  return (
    <div className={className}>
      <label
        htmlFor={(children.props as { id?: string }).id ?? id}
        className="block text-small font-medium text-ink mb-1.5"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-error ms-0.5">
            {requiredMark}
          </span>
        )}
      </label>
      {control}
      {message && (
        <p
          id={messageId}
          className={cn('mt-1.5 text-caption', error ? 'text-error' : 'text-ink-tertiary')}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, hint, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 w-[1.125rem] h-[1.125rem] shrink-0 rounded-xs border-line-strong accent-[var(--ink)] cursor-pointer"
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={inputId} className="text-small font-medium text-ink cursor-pointer">
          {label}
        </label>
        {hint && (
          <p id={`${inputId}-hint`} className="text-caption text-ink-tertiary mt-0.5">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
});
Checkbox.displayName = 'Checkbox';
