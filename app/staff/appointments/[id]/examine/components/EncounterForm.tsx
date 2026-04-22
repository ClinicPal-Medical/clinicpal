'use client';

import { PrescriptionsPanel } from './PrescriptionsPanel';
import { CertificatesPanel } from './CertificatesPanel';
import { ReferralsPanel } from './ReferralsPanel';
import type { PrescriptionData, CertificateData, ReferralData } from '@/modules/encounters/types';

interface EncounterFormProps {
  appointmentId: string;
  chiefComplaint: string;
  examination: string;
  diagnosis: string;
  plan: string;
  prescriptions: PrescriptionData[];
  certificates: CertificateData[];
  referrals: ReferralData[];
  stockItems: { id: string; name: string; quantity: number }[];
  onChiefComplaintChange: (v: string) => void;
  onExaminationChange: (v: string) => void;
  onDiagnosisChange: (v: string) => void;
  onPlanChange: (v: string) => void;
  onPrescriptionsChange: (p: PrescriptionData[]) => void;
  onCertificatesChange: (c: CertificateData[]) => void;
  onReferralsChange: (r: ReferralData[]) => void;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {label}
      {required && <span className="text-amber-500 ml-1">*</span>}
    </label>
  );
}

export function EncounterForm({
  appointmentId,
  chiefComplaint,
  examination,
  diagnosis,
  plan,
  prescriptions,
  certificates,
  referrals,
  stockItems,
  onChiefComplaintChange,
  onExaminationChange,
  onDiagnosisChange,
  onPlanChange,
  onPrescriptionsChange,
  onCertificatesChange,
  onReferralsChange,
}: EncounterFormProps) {
  const commonTextareaClasses = "w-full min-h-[88px] p-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-[13px] leading-relaxed resize-y outline-none transition-all focus:border-blue-500 focus:bg-blue-50/30 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400";

  return (
    <div className="p-5 pb-8">
      {/* ── Four clinical fields ── */}
      <div className="flex flex-col gap-4 mb-7">
        <div>
          <FieldLabel label="Chief Complaint" required />
          <textarea
            value={chiefComplaint}
            onChange={(e) => onChiefComplaintChange(e.target.value)}
            placeholder="Patient's presenting complaint and duration…"
            className={commonTextareaClasses}
          />
        </div>

        <div>
          <FieldLabel label="Examination Findings" />
          <textarea
            value={examination}
            onChange={(e) => onExaminationChange(e.target.value)}
            placeholder="Vital signs, physical examination findings…"
            className={`${commonTextareaClasses} min-h-[80px]`}
          />
        </div>

        <div>
          <FieldLabel label="Diagnosis" required />
          <textarea
            value={diagnosis}
            onChange={(e) => onDiagnosisChange(e.target.value)}
            placeholder="Primary and secondary diagnoses (ICD codes optional)…"
            className={`${commonTextareaClasses} min-h-[72px]`}
          />
        </div>

        <div>
          <FieldLabel label="Management Plan" />
          <textarea
            value={plan}
            onChange={(e) => onPlanChange(e.target.value)}
            placeholder="Treatment plan, follow-up instructions, lifestyle advice…"
            className={`${commonTextareaClasses} min-h-[80px]`}
          />
        </div>
      </div>

      {/* ── Expandable document panels ── */}
      <div className="flex flex-col gap-3">
        <PrescriptionsPanel
          appointmentId={appointmentId}
          prescriptions={prescriptions}
          stockItems={stockItems}
          onPrescriptionsChange={onPrescriptionsChange}
        />
        <CertificatesPanel
          appointmentId={appointmentId}
          certificates={certificates}
          onCertificatesChange={onCertificatesChange}
        />
        <ReferralsPanel
          appointmentId={appointmentId}
          referrals={referrals}
          onReferralsChange={onReferralsChange}
        />
      </div>
    </div>
  );
}
