'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  User,
} from 'lucide-react';
import { PatientContext } from './components/PatientContext';
import { EncounterForm } from './components/EncounterForm';
import { ActionsPanel } from './components/ActionsPanel';
import { CompleteModal } from './components/CompleteModal';
import type { EncounterPageData, PrescriptionData, CertificateData, ReferralData } from '@/modules/encounters/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
type MobileTab = 'history' | 'examination' | 'actions';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExaminationWorkspace({ data }: { data: EncounterPageData }) {
  const router = useRouter();
  const { encounter, appointment, patient, stockItems, nextPatient, doctorName } = data;

  // ── Encounter text fields ──
  const [chiefComplaint, setChiefComplaint] = useState(encounter.chiefComplaint ?? '');
  const [examination, setExamination] = useState(encounter.examination ?? '');
  const [diagnosis, setDiagnosis] = useState(encounter.diagnosis ?? '');
  const [plan, setPlan] = useState(encounter.plan ?? '');

  // ── Document state ──
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(encounter.prescriptions);
  const [certificates, setCertificates] = useState<CertificateData[]>(encounter.certificates);
  const [referrals, setReferrals] = useState<ReferralData[]>(encounter.referrals);

  // ── UI state ──
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTab, setActiveTab] = useState<MobileTab>('examination');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestFieldsRef = useRef({ chiefComplaint, examination, diagnosis, plan });

  // Keep refs in sync for the debounced autosave
  useEffect(() => {
    latestFieldsRef.current = { chiefComplaint, examination, diagnosis, plan };
  }, [chiefComplaint, examination, diagnosis, plan]);

  // ── Autosave ──
  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/staff/encounters/${appointment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestFieldsRef.current),
        });
        if (!res.ok) throw new Error('Save failed');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('failed');
        // Auto-retry after 5 seconds
        retryTimerRef.current = setTimeout(triggerSave, 5000);
      }
    }, 1000);
  }, [appointment.id]);

  const handleFieldChange = (
    setter: (v: string) => void,
    value: string
  ) => {
    setter(value);
    triggerSave();
  };

  // ── Complete encounter ──
  const draftCount =
    prescriptions.filter((p) => p.status === 'DRAFT').length +
    certificates.filter((c) => !c.issuedAt).length +
    referrals.filter((r) => !r.issuedAt).length;

  const canComplete = chiefComplaint.trim().length > 0 && diagnosis.trim().length > 0;

  const handleCompleteConfirm = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/staff/encounters/${appointment.id}/complete`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Failed to complete appointment');
        setCompleting(false);
        return;
      }
      const { nextPatient: next } = await res.json();
      const toastMsg = next
        ? `Appointment completed. Next patient: ${next.patientName}`
        : 'Appointment completed.';
      router.push(`/staff/appointments?toast=${encodeURIComponent(toastMsg)}`);
    } catch {
      alert('An error occurred. Please try again.');
      setCompleting(false);
    }
  };

  // ── Scheduled time display ──
  let apptTime = '';
  if (appointment.scheduledAt) {
    const d = new Date(appointment.scheduledAt);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    apptTime = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // ── Mobile tab bar ──
  const tabs: { key: MobileTab; label: string }[] = [
    { key: 'history', label: 'Patient History' },
    { key: 'examination', label: 'Examination' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen text-slate-800 bg-slate-50">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/appointments"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-semibold px-2.5 py-1 rounded-lg transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <span className="text-slate-300 text-base">|</span>
          <span className="text-[15px] font-bold text-slate-900">
            Clinic<span className="text-blue-600">Pal</span>
          </span>
          <span className="text-sm text-slate-500">Clinical Workspace</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Save status */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-slate-500">Saving…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
          {saveStatus === 'failed' && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle size={13} /> Save failed — retrying
            </span>
          )}

          {/* Patient + time */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 justify-end">
              <User size={14} className="text-blue-600" />
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 justify-end mt-0.5">
              <Clock size={11} /> {apptTime}
              {appointment.reason ? ` · ${appointment.reason}` : ''} · {doctorName}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile tab bar / Desktop headers ── */}
      <div className="flex lg:grid lg:grid-cols-[300px_1fr_260px] bg-slate-50 border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 lg:flex-none py-2.5 px-2 text-xs font-semibold transition-all duration-150 outline-none
                ${isActive ? 'border-b-2 border-b-blue-500 bg-blue-50 text-blue-600' : 'border-b-2 border-b-transparent bg-transparent text-slate-500'}
                lg:border-b-0 lg:bg-transparent lg:text-slate-600 lg:cursor-default lg:hover:bg-transparent
                ${tab.key === 'history' ? 'lg:border-r lg:border-slate-200' : ''}
                ${tab.key === 'actions' ? 'lg:border-l lg:border-slate-200' : ''}
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Three-column workspace ── */}
      <div
        className="flex-1 flex flex-col lg:grid lg:grid-cols-[300px_1fr_260px] overflow-hidden min-h-0"
      >
        {/* LEFT — patient context */}
        <div
          className={`flex-1 lg:flex-none overflow-y-auto bg-slate-50 lg:border-r lg:border-slate-200 ${activeTab !== 'history' ? 'hidden lg:block' : 'block'}`}
        >
          <PatientContext patient={patient} />
        </div>

        {/* CENTRE — encounter form */}
        <div
          className={`flex-1 lg:flex-none overflow-y-auto bg-white ${activeTab !== 'examination' ? 'hidden lg:block' : 'block'}`}
        >
          <EncounterForm
            appointmentId={appointment.id}
            chiefComplaint={chiefComplaint}
            examination={examination}
            diagnosis={diagnosis}
            plan={plan}
            prescriptions={prescriptions}
            certificates={certificates}
            referrals={referrals}
            stockItems={stockItems}
            onChiefComplaintChange={(v) => handleFieldChange(setChiefComplaint, v)}
            onExaminationChange={(v) => handleFieldChange(setExamination, v)}
            onDiagnosisChange={(v) => handleFieldChange(setDiagnosis, v)}
            onPlanChange={(v) => handleFieldChange(setPlan, v)}
            onPrescriptionsChange={setPrescriptions}
            onCertificatesChange={setCertificates}
            onReferralsChange={setReferrals}
          />
        </div>

        {/* RIGHT — actions */}
        <div
          className={`flex-1 lg:flex-none overflow-y-auto bg-slate-50 lg:border-l lg:border-slate-200 ${activeTab !== 'actions' ? 'hidden lg:block' : 'block'}`}
        >
          <ActionsPanel
            nextPatient={nextPatient}
            canComplete={canComplete}
            missingFields={[
              !chiefComplaint.trim() && 'Chief complaint',
              !diagnosis.trim() && 'Diagnosis',
            ].filter(Boolean) as string[]}
            draftCount={draftCount}
            onCompleteClick={() => setShowCompleteModal(true)}
          />
        </div>
      </div>

      {/* Complete modal */}
      {showCompleteModal && (
        <CompleteModal
          draftCount={draftCount}
          completing={completing}
          onConfirm={handleCompleteConfirm}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
}
