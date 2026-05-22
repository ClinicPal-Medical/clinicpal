'use client';

import { useEffect, type ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl';

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

type Props = {
  open: boolean;
  onClose?: () => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  maxWidth?: MaxWidth;
  /** Overlay z-index class, e.g. 'z-50' or 'z-[200]'. */
  zIndexClass?: string;
  children: ReactNode;
  /** When true, clicking the overlay calls onClose. Defaults to true if onClose is provided. */
  closeOnOverlayClick?: boolean;
};

export default function Modal({
  open,
  onClose,
  onSubmit,
  maxWidth = 'lg',
  zIndexClass = 'z-50',
  children,
  closeOnOverlayClick,
}: Props) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const dismissOnOverlay = closeOnOverlayClick ?? Boolean(onClose);
  const cardClasses = `bg-white rounded-3xl p-6 w-full ${MAX_WIDTH_CLASSES[maxWidth]} shadow-xl animate-in fade-in zoom-in-95 duration-300`;

  const card = onSubmit ? (
    <form onSubmit={onSubmit} className={cardClasses}>
      {children}
    </form>
  ) : (
    <div className={cardClasses}>{children}</div>
  );

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 ${zIndexClass}`}
      onClick={dismissOnOverlay ? onClose : undefined}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full flex items-center justify-center">
        {card}
      </div>
    </div>
  );
}
