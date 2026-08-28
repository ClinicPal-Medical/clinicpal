'use client';

import type { InputHTMLAttributes } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Clock, type LucideIcon } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import type { FieldBaseProps } from './types';

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'value' | 'onChange' | 'onBlur' | 'disabled' | 'size' | 'step'
>;

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FieldBaseProps<TFieldValues, TName> &
  NativeProps & {
    leftIcon?: LucideIcon | null;
  };

function formatForView(raw: string): string {
  if (!raw) return '—';
  return raw.replace('T', ' ').replace(/-/g, '/');
}

export default function DateTimeInput<
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
  leftIcon: LeftIcon = Clock,
  placeholder,
  ...rest
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const id = rest.id ?? name;
  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const value = typeof field.value === 'string' ? field.value : '';

  if (viewOnly) {
    return (
      <FieldWrapper
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={className}
      >
        <p className="text-sm font-semibold text-slate-800 py-1">
          {formatForView(value)}
        </p>
      </FieldWrapper>
    );
  }

  const borderColor = error ? 'border-red-300' : 'border-slate-100';
  const bg = disabled
    ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
    : 'bg-slate-50 text-slate-800';
  const focusClasses = disabled
    ? 'font-medium'
    : 'focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium';
  const padLeft = LeftIcon ? 'pl-10' : '';

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon size={18} className="text-slate-400" />
          </div>
        )}
        <input
          {...rest}
          {...field}
          id={id}
          type="datetime-local"
          step={1}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => field.onChange(e.target.value)}
          className={`w-full p-4 border-2 ${borderColor} ${bg} rounded-xl ${focusClasses} ${padLeft} ${className}`}
        />
      </div>
    </FieldWrapper>
  );
}
