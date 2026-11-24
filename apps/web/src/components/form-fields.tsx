'use client';

import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Label above the field, help and error below; errors are announced. */
export function Field({ label, help, error, optional, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {help && (
        <p id={helpId} className="field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={errId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Large tappable single-choice tiles (radio group). */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  help,
  columns = 1,
  optional,
}: {
  legend: ReactNode;
  name: string;
  options: ReadonlyArray<readonly [T, string]>;
  value: T | undefined | null;
  onChange: (v: T) => void;
  error?: string;
  help?: ReactNode;
  columns?: 1 | 2 | 3;
  optional?: boolean;
}) {
  const id = useId();
  const cols = columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '';
  return (
    <fieldset aria-describedby={error ? `${id}-err` : help ? `${id}-help` : undefined}>
      <legend className="field-label">
        {legend}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </legend>
      {help && (
        <p id={`${id}-help`} className="field-help -mt-1 mb-2">
          {help}
        </p>
      )}
      <div className={`grid gap-2 ${cols}`}>
        {options.map(([v, label]) => {
          const checked = value === v;
          return (
            <label
              key={v}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-base transition-colors ${
                checked ? 'border-navy bg-navy/5 font-semibold text-navy' : 'border-line bg-white text-navy hover:border-navy/50'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={v}
                checked={checked}
                onChange={() => onChange(v)}
                className="h-5 w-5 accent-[#0D2240]"
              />
              {label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function CheckboxGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  max,
  error,
  help,
  optional,
}: {
  legend: ReactNode;
  options: ReadonlyArray<readonly [T, string]>;
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  error?: string;
  help?: ReactNode;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend className="field-label">
        {legend}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </legend>
      {help && <p className="field-help -mt-1 mb-2">{help}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(([v, label]) => {
          const checked = value.includes(v);
          const disabled = !checked && max !== undefined && value.length >= max;
          return (
            <label
              key={v}
              className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                checked ? 'border-navy bg-navy/5 font-semibold' : 'border-line bg-white'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} text-navy`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(checked ? value.filter((x) => x !== v) : [...value, v])}
                className="h-5 w-5 accent-[#0D2240]"
              />
              {label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const fmt = (n: number | undefined | null) => (n === undefined || n === null || Number.isNaN(n) ? '' : n.toLocaleString('en-NG'));

/** Money in whole units, numeric keyboard, live thousand separators. */
export function MoneyInput({
  id,
  value,
  onChange,
  symbol,
  describedBy,
  invalid,
}: {
  id: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  symbol: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-muted">{symbol}</span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        className="input num pl-12"
        placeholder="0"
        value={fmt(value)}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 13);
          onChange(digits ? Number(digits) : undefined);
        }}
      />
    </div>
  );
}

export const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', CAD: 'C$', EUR: '€', AED: 'AED' };
