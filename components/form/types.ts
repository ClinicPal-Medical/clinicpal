import type { ReactNode } from 'react';
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

export type DocTone = 'blue' | 'emerald' | 'amber';

export const DOC_FOCUS_RING: Record<DocTone, string> = {
  blue: 'focus:border-blue-500 focus:ring-blue-500/20',
  emerald: 'focus:border-emerald-500 focus:ring-emerald-500/20',
  amber: 'focus:border-amber-500 focus:ring-amber-500/20',
};

export const DOC_CHECKBOX_COLOR: Record<DocTone, string> = {
  blue: 'text-blue-600 focus:ring-blue-500',
  emerald: 'text-emerald-600 focus:ring-emerald-500',
  amber: 'text-amber-600 focus:ring-amber-500',
};

export type FieldBaseProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  viewOnly?: boolean;
  className?: string;
};
