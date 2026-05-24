import type { LucideIcon } from 'lucide-react';

export type StatTone =
  | 'amber'
  | 'blue'
  | 'emerald'
  | 'purple'
  | 'red'
  | 'slate';

const TONE_CLASSES: Record<StatTone, string> = {
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
};

type Props = {
  icon: LucideIcon;
  tone: StatTone;
  label: string;
  value: string | number;
};

export default function StatCard({ icon: Icon, tone, label, value }: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${TONE_CLASSES[tone]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
