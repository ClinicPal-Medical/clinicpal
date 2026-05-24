import { forwardRef, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type Size = 'sm' | 'md';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'p-3 border',
  md: 'p-4 border-2',
};

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  fieldSize?: Size;
};

const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  {
    label,
    error,
    hint,
    icon: Icon,
    fieldSize = 'md',
    disabled,
    className = '',
    id,
    ...rest
  },
  ref,
) {
  const borderColor = error
    ? 'border-red-300'
    : fieldSize === 'sm'
      ? 'border-slate-200'
      : 'border-slate-100';

  const bg = disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 text-slate-800';

  const inputClasses = `w-full ${SIZE_CLASSES[fieldSize]} ${bg} ${borderColor} rounded-xl ${
    disabled
      ? 'font-medium'
      : 'focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium'
  } ${Icon ? 'pl-10' : ''} ${className}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={18} className="text-slate-400" />
          </div>
        )}
        <input ref={ref} id={id} disabled={disabled} className={inputClasses} {...rest} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400 mt-2 font-medium">{hint}</p>}
    </div>
  );
});

export default TextField;
