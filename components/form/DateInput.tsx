'use client';

import type { InputHTMLAttributes } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Calendar, type LucideIcon } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import { DOC_FOCUS_RING, type DocTone, type FieldBaseProps } from './types';

export type DateVariant = 'year' | 'month' | 'date';

type Size = 'sm' | 'md' | 'doc';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border text-sm rounded-xl',
  md: 'p-4 border-2 rounded-xl',
  doc: 'px-2.5 py-1.5 border text-xs rounded-lg',
};

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'value' | 'onChange' | 'onBlur' | 'disabled' | 'size'
>;

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FieldBaseProps<TFieldValues, TName> &
  NativeProps & {
    variant?: DateVariant;
    leftIcon?: LucideIcon | null;
    fieldSize?: Size;
    tone?: DocTone;
  };

function formatForView(variant: DateVariant, raw: string): string {
  if (!raw) return '—';
  if (variant === 'year') return raw;
  return raw.replace(/-/g, '/');
}

export default function DateInput<
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
  variant = 'date',
  leftIcon: LeftIcon = Calendar,
  fieldSize = 'md',
  tone = 'blue',
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
        fieldSize={fieldSize}
      >
        <p className="text-sm font-semibold text-slate-800 py-1">
          {formatForView(variant, value)}
        </p>
      </FieldWrapper>
    );
  }

  const isDoc = fieldSize === 'doc';
  const borderColor = error
    ? 'border-red-300'
    : isDoc
      ? 'border-slate-200'
      : fieldSize === 'sm'
        ? 'border-slate-200'
        : 'border-slate-100';
  const bg = disabled
    ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
    : isDoc
      ? 'bg-white text-slate-800'
      : 'bg-slate-50 text-slate-800';
  const focusClasses = disabled
    ? 'font-medium'
    : isDoc
      ? `${DOC_FOCUS_RING[tone]} outline-none transition-all focus:ring-2`
      : 'focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium';
  const padLeft = LeftIcon ? 'pl-10' : '';

  const inputType =
    variant === 'month' ? 'month' : variant === 'date' ? 'date' : 'text';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (variant === 'year') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
      field.onChange(digits);
    } else {
      field.onChange(e.target.value);
    }
  };

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      fieldSize={fieldSize}
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
          type={inputType}
          inputMode={variant === 'year' ? 'numeric' : undefined}
          maxLength={variant === 'year' ? 4 : undefined}
          placeholder={
            placeholder ?? (variant === 'year' ? 'YYYY' : undefined)
          }
          disabled={disabled}
          value={value}
          onChange={handleChange}
          className={`w-full ${SIZE_CLASSES[fieldSize]} ${borderColor} ${bg} ${focusClasses} ${padLeft} ${className}`}
        />
      </div>
    </FieldWrapper>
  );
}
