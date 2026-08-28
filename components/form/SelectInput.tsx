'use client';

import type { SelectHTMLAttributes } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import type { FieldBaseProps } from './types';

export type SelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type Size = 'sm' | 'md';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border text-sm',
  md: 'p-4 border-2',
};

type NativeProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'name' | 'value' | 'onChange' | 'onBlur' | 'disabled' | 'children' | 'size'
>;

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FieldBaseProps<TFieldValues, TName> &
  NativeProps & {
    options: SelectOption[];
    placeholder?: string;
    leftIcon?: LucideIcon;
    fieldSize?: Size;
  };

export default function SelectInput<
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
  placeholder,
  leftIcon: LeftIcon,
  fieldSize = 'md',
  ...rest
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const id = rest.id ?? name;
  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const rawValue = field.value;
  const currentString =
    rawValue === null || rawValue === undefined ? '' : String(rawValue);

  if (viewOnly) {
    const match = options.find((o) => String(o.value) === currentString);
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
          {match?.label ?? '—'}
        </p>
      </FieldWrapper>
    );
  }

  const borderColor = error
    ? 'border-red-300'
    : fieldSize === 'sm'
      ? 'border-slate-200'
      : 'border-slate-100';
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
        <select
          {...rest}
          {...field}
          id={id}
          disabled={disabled}
          value={currentString}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') {
              field.onChange(null);
              return;
            }
            const sample = options.find((o) => String(o.value) === v);
            field.onChange(typeof sample?.value === 'number' ? Number(v) : v);
          }}
          className={`w-full ${SIZE_CLASSES[fieldSize]} pr-10 ${borderColor} ${bg} rounded-xl ${focusClasses} appearance-none ${padLeft} ${className}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={String(opt.value)}
              value={String(opt.value)}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={18} className="text-slate-400" />
        </div>
      </div>
    </FieldWrapper>
  );
}
