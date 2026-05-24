import { forwardRef, type TextareaHTMLAttributes } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

const TextareaField = forwardRef<HTMLTextAreaElement, Props>(function TextareaField(
  { label, error, hint, className = '', id, ...rest },
  ref,
) {
  const borderColor = error ? 'border-red-300' : 'border-slate-100';

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full p-4 bg-slate-50 border-2 ${borderColor} rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400 mt-2 font-medium">{hint}</p>}
    </div>
  );
});

export default TextareaField;
