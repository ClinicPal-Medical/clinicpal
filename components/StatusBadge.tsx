import type { ReactNode } from 'react';

export type BadgeTone =
  | 'amber'
  | 'blue'
  | 'emerald'
  | 'green'
  | 'orange'
  | 'purple'
  | 'red'
  | 'slate';

const TONE_CLASSES: Record<BadgeTone, string> = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  COMPLETED: 'emerald',
  CANCELLED: 'slate',
  NO_SHOW: 'red',

  PAID: 'emerald',
  UNPAID: 'red',

  OK: 'emerald',
  LOW: 'amber',
  CRITICAL: 'red',
  EXPIRING: 'orange',

  DRAFT: 'amber',
  ISSUED: 'emerald',

  ROUTINE: 'blue',
  URGENT: 'amber',
  EMERGENCY: 'red',

  INTERNAL: 'blue',
  EXTERNAL: 'purple',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 rounded text-[10px] font-black tracking-wider',
  md: 'px-3 py-1 rounded-full text-xs font-bold tracking-wider',
} as const;

type Props = {
  status: string;
  tone?: BadgeTone;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  children?: ReactNode;
};

export default function StatusBadge({
  status,
  tone,
  size = 'md',
  className = '',
  children,
}: Props) {
  const resolvedTone = tone ?? STATUS_TONES[status] ?? 'slate';
  return (
    <span
      className={`inline-flex items-center uppercase ${SIZE_CLASSES[size]} ${TONE_CLASSES[resolvedTone]} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
