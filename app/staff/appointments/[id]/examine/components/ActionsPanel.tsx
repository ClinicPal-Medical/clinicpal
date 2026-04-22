'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface ActionsPanelProps {
  nextPatient: { patientName: string; scheduledAt: string } | null;
  canComplete: boolean;
  missingFields: string[];
  draftCount: number;
  onCompleteClick: () => void;
}

export function ActionsPanel({
  nextPatient,
  canComplete,
  missingFields,
  draftCount,
  onCompleteClick,
}: ActionsPanelProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const nextTime = nextPatient
    ? new Date(nextPatient.scheduledAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* ── Next patient card ── */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Next in Queue
        </div>
        {nextPatient ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <ArrowRight size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900">
                {nextPatient.patientName}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {nextTime}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 m-0">
            No further appointments today.
          </p>
        )}
      </div>

      {/* ── Draft warning ── */}
      {draftCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 py-2.5 px-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 m-0 leading-relaxed">
            {draftCount} unissued document{draftCount > 1 ? 's' : ''} — issue or delete before
            completing.
          </p>
        </div>
      )}

      {/* ── Complete button ── */}
      <div className="relative">
        <button
          id="complete-appointment-btn"
          disabled={!canComplete}
          onClick={canComplete ? onCompleteClick : undefined}
          onMouseEnter={() => !canComplete && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-full py-3.5 px-5 rounded-xl border-none font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
            ${canComplete ? 'cursor-pointer bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'cursor-not-allowed bg-slate-100 text-slate-400'}
          `}
        >
          <CheckCircle2 size={16} />
          Complete Appointment
        </button>

        {/* Tooltip for disabled state */}
        {showTooltip && !canComplete && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-amber-500 z-10">
            Please enter at least:{' '}
            <strong>{missingFields.join(' and ')}</strong> before completing.
          </div>
        )}
      </div>

      {/* Required fields hint */}
      <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
        <span className="text-amber-500">*</span> Chief complaint and Diagnosis are required to
        complete this appointment.
      </p>
    </div>
  );
}
