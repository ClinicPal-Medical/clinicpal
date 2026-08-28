'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { DOC_CHECKBOX_COLOR, type DocTone, type FieldBaseProps } from './types';

type Size = 'md' | 'doc';

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'value' | 'checked' | 'onChange' | 'onBlur' | 'disabled'
>;

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<FieldBaseProps<TFieldValues, TName>, 'label'> &
  NativeProps & {
    label: ReactNode;
    description?: ReactNode;
    fieldSize?: Size;
    tone?: DocTone;
  };

export default function CheckboxInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  label,
  description,
  hint,
  disabled,
  viewOnly,
  className = '',
  fieldSize = 'md',
  tone = 'blue',
  ...rest
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const id = rest.id ?? name;
  const error = fieldState.error?.message;
  const checked = Boolean(field.value);
  const isDoc = fieldSize === 'doc';

  if (viewOnly) {
    return (
      <div className={className}>
        <div className="flex items-start gap-2">
          <span
            className={`inline-flex items-center justify-center h-5 w-5 rounded border text-xs font-bold ${
              checked
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            aria-hidden="true"
          >
            {checked ? '✓' : ''}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
        {!error && hint && (
          <p className="text-xs text-slate-400 mt-2 font-medium">{hint}</p>
        )}
      </div>
    );
  }

  if (isDoc) {
    return (
      <div className={className}>
        <label
          htmlFor={id}
          className={`text-xs text-slate-700 flex items-center gap-1.5 select-none ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          <input
            {...rest}
            {...field}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => field.onChange(e.target.checked)}
            className={`rounded border-slate-300 ${DOC_CHECKBOX_COLOR[tone]}`}
          />
          {label}
        </label>
        {error && (
          <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>
        )}
        {!error && hint && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{hint}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`flex items-start gap-3 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <input
          {...rest}
          {...field}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => field.onChange(e.target.checked)}
          className="h-5 w-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
        />
        <div className="flex-1">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {description}
            </p>
          )}
        </div>
      </label>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
      {!error && hint && (
        <p className="text-xs text-slate-400 mt-2 font-medium">{hint}</p>
      )}
    </div>
  );
}
