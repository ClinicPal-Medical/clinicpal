'use client';

import { AlertTriangle } from 'lucide-react';

interface CompleteModalProps {
  draftCount: number;
  completing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CompleteModal({
  draftCount,
  completing,
  onConfirm,
  onCancel,
}: CompleteModalProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 w-full max-w-[440px] shadow-xl">
        {draftCount > 0 && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-[1px]" />
            <p className="text-[13px] text-amber-700 m-0 leading-relaxed">
              You have <strong className="font-bold">{draftCount} unissued document{draftCount > 1 ? 's' : ''}</strong>. They
              will remain as drafts and will not be given to the patient.
            </p>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Complete Appointment
        </h2>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
          This will mark the appointment as completed and lock the encounter. This action cannot be
          undone.
        </p>

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            disabled={completing}
            className="px-5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-[13px] cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-complete-btn"
            onClick={onConfirm}
            disabled={completing}
            className={`px-5 py-2 rounded-xl border-none text-white font-bold text-[13px] transition-all
              ${completing ? 'bg-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)]'}
            `}
          >
            {completing ? 'Completing…' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
