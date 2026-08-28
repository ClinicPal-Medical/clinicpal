'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  useController,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Loader2, type LucideIcon } from 'lucide-react';
import FieldWrapper from './FieldWrapper';
import type { FieldBaseProps } from './types';

type Size = 'sm' | 'md';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border text-sm',
  md: 'p-4 border-2',
};

type Props<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TOption,
> = FieldBaseProps<TFieldValues, TName> & {
  onSearch: (query: string) => Promise<TOption[]>;
  onSelect?: (option: TOption) => void;
  onUserChange?: (value: string) => void;
  getOptionKey: (option: TOption) => string;
  getOptionLabel: (option: TOption) => string;
  renderOption: (option: TOption) => ReactNode;
  minChars?: number;
  debounceMs?: number;
  placeholder?: string;
  leftIcon?: LucideIcon;
  rightAdornment?: ReactNode;
  fieldSize?: Size;
};

export default function AutocompleteInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TOption = unknown,
>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  viewOnly,
  className = '',
  onSearch,
  onSelect,
  onUserChange,
  getOptionKey,
  getOptionLabel,
  renderOption,
  minChars = 3,
  debounceMs = 300,
  placeholder,
  leftIcon: LeftIcon,
  rightAdornment,
  fieldSize = 'md',
}: Props<TFieldValues, TName, TOption>) {
  const { field, fieldState } = useController({ control, name, rules });
  const [options, setOptions] = useState<TOption[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);
  const requestIdRef = useRef(0);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const id = name;
  const error = fieldState.error?.message;
  const required = Boolean(rules?.required);
  const value = typeof field.value === 'string' ? field.value : '';

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (value.length < minChars) {
      setOptions([]);
      setShow(false);
      return;
    }
    const myId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await onSearchRef.current(value);
        if (requestIdRef.current !== myId) return;
        setOptions(data);
        setShow(data.length > 0);
      } finally {
        if (requestIdRef.current === myId) setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, minChars, debounceMs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
          {value || '—'}
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
  const showSpinner = loading && !rightAdornment;
  const padRight = rightAdornment || showSpinner ? 'pr-10' : '';

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div ref={wrapperRef} className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon size={18} className="text-slate-400" />
          </div>
        )}
        <input
          {...field}
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value;
            field.onChange(v);
            onUserChange?.(v);
          }}
          onFocus={() => {
            if (options.length > 0) setShow(true);
          }}
          className={`w-full ${SIZE_CLASSES[fieldSize]} ${bg} ${borderColor} rounded-xl ${focusClasses} ${padLeft} ${padRight} ${className}`}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightAdornment}
          </div>
        )}
        {showSpinner && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
          />
        )}

        {show && options.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={getOptionKey(opt)}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  skipSearchRef.current = true;
                  field.onChange(getOptionLabel(opt));
                  setShow(false);
                  setOptions([]);
                  onSelect?.(opt);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
              >
                {renderOption(opt)}
              </button>
            ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
