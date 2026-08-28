'use client';

import type { ReactNode } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import FieldWrapper from './FieldWrapper';
import type { FieldBaseProps } from './types';

export type RadioOption = {
  label: ReactNode;
  value: string | number;
  description?: ReactNode;
  disabled?: boolean;
};

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FieldBaseProps<TFieldValues, TName> & {
  options: RadioOption[];
  orientation?: 'vertical' | 'horizontal';
};

export default function RadioGroupInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  viewOnly,
  className = '',
  options,
  orientation = 'vertical',
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const rawValue = field.value;
  const currentString =
    rawValue === null || rawValue === undefined ? '' : String(rawValue);

  if (viewOnly) {
    const match = options.find((o) => String(o.value) === currentString);
    return (
      <FieldWrapper
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={className}
      >
        <p className="text-sm font-semibold text-slate-800 py-1">
          {match?.label ?? '—'}
        </p>
      </FieldWrapper>
    );
  }

  const layout =
    orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2';

  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div role="radiogroup" className={layout}>
        {options.map((opt) => {
          const optId = `${name}-${String(opt.value)}`;
          const isChecked = currentString === String(opt.value);
          const optDisabled = disabled || opt.disabled;
          return (
            <label
              key={String(opt.value)}
              htmlFor={optId}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                isChecked
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-100 bg-slate-50'
              } ${
                optDisabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:border-blue-200'
              }`}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={String(opt.value)}
                checked={isChecked}
                disabled={optDisabled}
                onChange={() =>
                  field.onChange(
                    typeof opt.value === 'number' ? opt.value : String(opt.value),
                  )
                }
                onBlur={field.onBlur}
                className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700">
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {opt.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </FieldWrapper>
  );
}
