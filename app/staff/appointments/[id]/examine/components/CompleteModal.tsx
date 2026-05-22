'use client';

import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

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
    <Modal open onClose={onCancel} maxWidth="md" zIndexClass="z-[200]">
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
        <Button variant="secondary" onClick={onCancel} disabled={completing}>
          Cancel
        </Button>
        <Button
          id="confirm-complete-btn"
          onClick={onConfirm}
          loading={completing}
          loadingText="Completing…"
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
        >
          Complete
        </Button>
      </div>
    </Modal>
  );
}
