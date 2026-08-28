'use client';

import type { TextareaHTMLAttributes } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import FieldWrapper from './FieldWrapper';
import { DOC_FOCUS_RING, type DocTone, type FieldBaseProps } from './types';

type Size = 'sm' | 'md' | 'doc';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border text-sm rounded-xl',
  md: 'p-4 border-2 rounded-xl',
  doc: 'px-2.5 py-1.5 border text-xs rounded-lg',
};

type NativeProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name' | 'value' | 'onChange' | 'onBlur' | 'disabled'
>;

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FieldBaseProps<TFieldValues, TName> &
  NativeProps & {
    fieldSize?: Size;
    tone?: DocTone;
  };

export default function TextareaInput<
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
  fieldSize = 'md',
  tone = 'blue',
  rows = 4,
  placeholder,
  ...rest
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const id = rest.id ?? name;
  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const value = typeof field.value === 'string' ? field.value : '';
  const isDoc = fieldSize === 'doc';

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
        <p className="text-sm text-slate-800 whitespace-pre-wrap py-1 font-medium">
          {value || '—'}
        </p>
      </FieldWrapper>
    );
  }

  const borderColor = error
    ? 'border-red-300'
    : isDoc
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
      <textarea
        {...rest}
        {...field}
        id={id}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => field.onChange(e.target.value)}
        className={`w-full ${SIZE_CLASSES[fieldSize]} ${borderColor} ${bg} ${focusClasses} ${className}`}
      />
    </FieldWrapper>
  );
}
