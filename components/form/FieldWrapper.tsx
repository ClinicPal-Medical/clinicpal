import type { ReactNode } from 'react';

export type FieldSize = 'sm' | 'md' | 'doc';

const LABEL_CLASSES: Record<FieldSize, string> = {
  sm: 'block text-sm font-bold text-slate-700 mb-2',
  md: 'block text-sm font-bold text-slate-700 mb-2',
  doc: 'block text-[10px] text-slate-500 mb-1',
};

const ERROR_CLASSES: Record<FieldSize, string> = {
  sm: 'text-xs text-red-500 mt-1 font-medium',
  md: 'text-xs text-red-500 mt-1 font-medium',
  doc: 'text-[11px] text-red-500 mt-1 font-medium',
};

const HINT_CLASSES: Record<FieldSize, string> = {
  sm: 'text-xs text-slate-400 mt-2 font-medium',
  md: 'text-xs text-slate-400 mt-2 font-medium',
  doc: 'text-[11px] text-slate-400 mt-1 font-medium',
};

type Props = {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  fieldSize?: FieldSize;
  children: ReactNode;
};

export default function FieldWrapper({
  id,
  label,
  hint,
  error,
  required,
  className = '',
  fieldSize = 'md',
  children,
}: Props) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES[fieldSize]}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className={ERROR_CLASSES[fieldSize]}>{error}</p>}
      {!error && hint && <p className={HINT_CLASSES[fieldSize]}>{hint}</p>}
    </div>
  );
}
