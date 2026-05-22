import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-md shadow-blue-200",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
  danger:
    "bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white shadow-md shadow-red-200",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "py-4 px-6 text-lg rounded-xl",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: "leading" | "trailing";
  children?: ReactNode;
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    loadingText,
    icon: Icon,
    iconPosition = "leading",
    disabled,
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const iconSize = size === "lg" ? 20 : size === "sm" ? 14 : 18;
  const label = loading && loadingText ? loadingText : children;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {Icon && iconPosition === "leading" && <Icon size={iconSize} />}
      {label}
      {Icon && iconPosition === "trailing" && <Icon size={iconSize} />}
    </button>
  );
});

export default Button;
