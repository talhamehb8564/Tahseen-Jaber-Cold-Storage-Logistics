import { CircleAlert } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utilities/cn";

/**
 * FORM FIELDS (§41)
 * ---------------------------------------------------------------------------
 * One set of accessible field primitives used by the inquiry form, the contact
 * form, the calculator and the admin screens.
 *
 * §37 requirements met here rather than re-derived per form: every field is
 * label-associated, errors are linked with aria-describedby and announced, the
 * invalid state is conveyed by more than colour alone (icon + border + text),
 * and focus is always visible.
 *
 * The error prop is a structural `{ message?: string }` rather than
 * react-hook-form's `FieldError` on purpose: Zod unions and `.optional().or()`
 * chains produce `Merge<FieldError, FieldErrorsImpl<{}>>`, whose `type` is
 * optional and therefore not assignable to `FieldError`. These components only
 * ever read `message`, so accepting the wider shape is both correct and simpler
 * than casting at every call site.
 */

export interface FieldMessage {
  message?: string | undefined;
}

interface BaseProps {
  label?: string;
  error?: FieldMessage | undefined;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}

const controlClass =
  "w-full rounded-[2px] border bg-midnight/60 px-3.5 py-3 font-sans text-sm text-frost placeholder:text-silver-dim/55 transition-colors duration-300 focus:outline-none";

function stateClass(error: FieldMessage | undefined) {
  return error
    ? "border-alert/70 focus:border-alert focus-visible:ring-2 focus-visible:ring-alert/40"
    : "border-hull-line hover:border-hull-raised focus:border-glow/70 focus-visible:ring-2 focus-visible:ring-glow/35";
}

/* --------------------------------------------------------------------------
   LABEL + ERROR + HINT WRAPPER
   -------------------------------------------------------------------------- */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: BaseProps & { htmlFor: string; children: ReactNode; label: string }) {
  const describedBy = cn(error && `${htmlFor}-error`, hint && `${htmlFor}-hint`) || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="tj-label mb-2 flex items-center gap-1.5"
      >
        {label}
        {required ? (
          <span className="text-glow" aria-hidden>
            *
          </span>
        ) : (
          <span className="font-mono text-[0.5rem] tracking-[0.14em] text-silver-dim/70 normal-case">
            optional
          </span>
        )}
      </label>

      {children}

      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="mt-2 text-[0.6875rem] leading-relaxed text-silver-dim">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-relaxed text-alert"
        >
          <CircleAlert size={13} strokeWidth={1.8} aria-hidden className="mt-px shrink-0" />
          {error.message}
        </p>
      ) : null}

      {/* Keeps aria-describedby stable whether or not an error is showing. */}
      <span className="sr-only" data-describedby={describedBy} />
    </div>
  );
}

/* --------------------------------------------------------------------------
   TEXT INPUT
   -------------------------------------------------------------------------- */
export interface TextFieldProps extends BaseProps {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "password";
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  min?: number | string;
  max?: number | string;
  step?: number | string;
  /** Props from react-hook-form's register(). */
  registerProps?: Record<string, unknown>;
}

export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  error,
  hint,
  required,
  className,
  min,
  max,
  step,
  registerProps,
}: TextFieldProps) {
  const id = useId();
  const fieldId = `${name}-${id}`;
  const describedBy = cn(error && `${fieldId}-error`, hint && !error && `${fieldId}-hint`) || undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-required={required}
        className={cn(controlClass, stateClass(error), type === "number" && "tabular font-mono")}
        {...registerProps}
      />
    </Field>
  );
}

/* --------------------------------------------------------------------------
   TEXTAREA
   -------------------------------------------------------------------------- */
export interface TextAreaFieldProps extends BaseProps {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  registerProps?: Record<string, unknown>;
}

export function TextAreaField({
  label,
  name,
  placeholder,
  rows = 5,
  maxLength,
  error,
  hint,
  required,
  className,
  registerProps,
}: TextAreaFieldProps) {
  const id = useId();
  const fieldId = `${name}-${id}`;
  const describedBy = cn(error && `${fieldId}-error`, hint && !error && `${fieldId}-hint`) || undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-required={required}
        className={cn(controlClass, stateClass(error), "resize-y leading-relaxed")}
        {...registerProps}
      />
    </Field>
  );
}

/* --------------------------------------------------------------------------
   SELECT
   -------------------------------------------------------------------------- */
export interface SelectFieldProps extends BaseProps {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  registerProps?: Record<string, unknown>;
}

export function SelectField({
  label,
  name,
  options,
  placeholder = "Select…",
  error,
  hint,
  required,
  className,
  registerProps,
}: SelectFieldProps) {
  const id = useId();
  const fieldId = `${name}-${id}`;
  const describedBy = cn(error && `${fieldId}-error`, hint && !error && `${fieldId}-hint`) || undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-required={required}
          className={cn(
            controlClass,
            stateClass(error),
            "appearance-none pr-10",
          )}
          {...registerProps}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="pointer-events-none absolute top-1/2 right-3.5 w-3 -translate-y-1/2 text-silver-dim"
        >
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
    </Field>
  );
}

/* --------------------------------------------------------------------------
   CHECKBOX
   -------------------------------------------------------------------------- */
export interface CheckboxFieldProps extends BaseProps {
  name: string;
  text: ReactNode;
  registerProps?: Record<string, unknown>;
}

export function CheckboxField({
  name,
  text,
  error,
  hint,
  className,
  registerProps,
}: CheckboxFieldProps) {
  const id = useId();
  const fieldId = `${name}-${id}`;
  const describedBy = cn(error && `${fieldId}-error`, hint && !error && `${fieldId}-hint`) || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={fieldId}
        className="group flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-silver"
      >
        <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
          <input
            id={fieldId}
            name={name}
            type="checkbox"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="peer size-[18px] cursor-pointer appearance-none rounded-[2px] border border-hull-line bg-midnight/60 transition-colors duration-300 checked:border-glow checked:bg-glow/18 group-hover:border-hull-raised focus-visible:ring-2 focus-visible:ring-glow/40 focus-visible:outline-none"
            {...registerProps}
          />
          <svg
            aria-hidden
            viewBox="0 0 12 10"
            className="pointer-events-none absolute w-3 text-glow opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          >
            <path
              d="M1 5.2 4.2 8.4 11 1.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{text}</span>
      </label>

      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="mt-2 pl-8 text-[0.6875rem] leading-relaxed text-silver-dim">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 pl-8 text-[0.6875rem] leading-relaxed text-alert"
        >
          <CircleAlert size={13} strokeWidth={1.8} aria-hidden className="mt-px shrink-0" />
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   HONEYPOT (§38)
   Hidden from people, filled by bots. Positioned off-screen rather than with
   `display:none`, which some bots detect and skip.
   -------------------------------------------------------------------------- */
export function HoneypotField({
  registerProps,
  label = "Website",
}: {
  registerProps?: Record<string, unknown>;
  label?: string;
}) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
      <label htmlFor="hp-website">{label}</label>
      <input
        id="hp-website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...registerProps}
      />
    </div>
  );
}
