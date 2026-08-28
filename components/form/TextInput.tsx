'use client';

import { useState, type InputHTMLAttributes } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import { DOC_FOCUS_RING, type DocTone, type FieldBaseProps } from './types';

export type TextInputVariant =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'currency'
  | 'float';

type Size = 'sm' | 'md' | 'doc';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border text-sm',
  md: 'p-4 border-2',
  doc: 'px-2.5 py-1.5 border text-xs rounded-lg',
};

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'value' | 'onChange' | 'onBlur' | 'disabled' | 'size'
>;

type Props<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  FieldBaseProps<TFieldValues, TName> &
    NativeProps & {
      type?: TextInputVariant;
      leftIcon?: LucideIcon;
      rightIcon?: LucideIcon;
      currencySymbol?: string;
      decimals?: number;
      fieldSize?: Size;
      tone?: DocTone;
    };

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export default function TextInput<
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
  type = 'text',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  currencySymbol = '$',
  decimals = 2,
  fieldSize = 'md',
  tone = 'blue',
  placeholder,
  ...rest
}: Props<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isNumeric = type === 'currency' || type === 'float';
  const [displayValue, setDisplayValue] = useState<string>(() =>
    isNumeric && typeof field.value === 'number' ? String(field.value) : '',
  );

  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const id = rest.id ?? name;

  if (viewOnly) {
    const formatted = renderViewOnly(field.value, type, currencySymbol, decimals);
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
        <p className="text-sm font-semibold text-slate-800 py-1">{formatted}</p>
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

  const hasLeftAffix = Boolean(LeftIcon) || type === 'currency';
  const hasRightAffix = Boolean(RightIcon) || type === 'password';
  const padLeft = hasLeftAffix ? 'pl-10' : '';
  const padRight = hasRightAffix ? 'pr-10' : '';

  const rounded = isDoc ? '' : 'rounded-xl';
  const inputClass = `w-full ${SIZE_CLASSES[fieldSize]} ${bg} ${borderColor} ${rounded} ${focusClasses} ${padLeft} ${padRight}`;

  const inputType =
    type === 'password'
      ? showPassword
        ? 'text'
        : 'password'
      : type === 'email'
        ? 'email'
        : type === 'tel'
          ? 'tel'
          : 'text';

  const inputMode: InputHTMLAttributes<HTMLInputElement>['inputMode'] = isNumeric
    ? 'decimal'
    : type === 'tel'
      ? 'tel'
      : type === 'email'
        ? 'email'
        : undefined;

  const stringValue = isNumeric
    ? focused
      ? displayValue
      : typeof field.value === 'number'
        ? type === 'currency'
          ? formatNumber(field.value, decimals)
          : String(field.value)
        : ''
    : typeof field.value === 'string' || typeof field.value === 'number'
      ? String(field.value)
      : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (isNumeric) {
      setDisplayValue(raw);
      field.onChange(parseNumeric(raw));
    } else {
      field.onChange(raw);
    }
  };

  const handleFocus = () => {
    if (isNumeric) {
      setDisplayValue(typeof field.value === 'number' ? String(field.value) : '');
      setFocused(true);
    }
  };

  const handleBlur = () => {
    if (isNumeric) setFocused(false);
    field.onBlur();
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
        {!LeftIcon && type === 'currency' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-500 font-semibold text-sm">{currencySymbol}</span>
          </div>
        )}

        <input
          {...rest}
          {...field}
          id={id}
          type={inputType}
          inputMode={inputMode}
          value={stringValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${inputClass} ${className}`}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {type !== 'password' && RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <RightIcon size={18} className="text-slate-400" />
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

function renderViewOnly(
  value: unknown,
  type: TextInputVariant,
  currencySymbol: string,
  decimals: number,
): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'password') return '••••••••';
  if (type === 'currency' && typeof value === 'number') {
    return `${currencySymbol}${formatNumber(value, decimals)}`;
  }
  if (type === 'float' && typeof value === 'number') {
    return formatNumber(value, decimals);
  }
  return String(value);
}
