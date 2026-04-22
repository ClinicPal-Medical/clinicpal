'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Pill, FileText, Navigation } from 'lucide-react';
import type { PatientContextData, PastEncounterData } from '@/modules/encounters/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  count,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 px-4 bg-transparent border-none cursor-pointer text-slate-500 text-left hover:bg-slate-100/50 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-blue-600">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </span>
        <span className="ml-auto text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
          {count}
        </span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ─── Past encounter entry ─────────────────────────────────────────────────────

function EncounterEntry({ enc }: { enc: PastEncounterData }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mx-3 my-1 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-start py-2.5 px-3 bg-transparent border-none cursor-pointer text-left gap-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1">
          <div className="text-[11px] text-slate-500 mb-0.5">
            {fmtDate(enc.createdAt)}
          </div>
          <div className="text-xs text-slate-800 font-bold">
            {enc.diagnosis ?? 'No diagnosis recorded'}
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={13} className="text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight size={13} className="text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 text-xs">
          {enc.chiefComplaint && (
            <Field label="Chief Complaint" value={enc.chiefComplaint} />
          )}
          {enc.examination && (
            <Field label="Examination" value={enc.examination} />
          )}
          {enc.plan && <Field label="Plan" value={enc.plan} />}

          {enc.prescriptions.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                Prescriptions
              </div>
              {enc.prescriptions.map((p) => (
                <div
                  key={p.id}
                  className="mb-1 py-1.5 px-2 bg-blue-50 rounded-lg text-[11px] text-blue-700"
                >
                  <span className="opacity-70">{p.type} · </span>
                  {p.items.map((i) => i.medicationName).join(', ')}
                </div>
              ))}
            </div>
          )}

          {enc.certificates.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                Certificates
              </div>
              {enc.certificates.map((c) => (
                <div
                  key={c.id}
                  className="mb-1 py-1.5 px-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-700"
                >
                  {c.diagnosis} · {c.fitForWork ? '✓ Fit' : '✗ Not fit'} · {fmtDate(c.fromDate)} – {fmtDate(c.toDate)}
                </div>
              ))}
            </div>
          )}

          {enc.referrals.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                Referrals
              </div>
              {enc.referrals.map((r) => (
                <div
                  key={r.id}
                  className="mb-1 py-1.5 px-2 bg-amber-50 rounded-lg text-[11px] text-amber-700"
                >
                  {r.referredTo} · {r.urgency}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-xs text-slate-700 leading-relaxed">{value}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PatientContext({ patient }: { patient: PatientContextData }) {
  // Flat lists derived from encounters
  const allPrescriptions = patient.encounters.flatMap((e) =>
    e.prescriptions.filter((p) => p.issuedAt).map((p) => ({ ...p, encDate: e.createdAt }))
  );
  const allDocs = patient.encounters.flatMap((e) => [
    ...e.certificates.filter((c) => c.issuedAt).map((c) => ({
      type: 'CERTIFICATE' as const,
      id: c.id,
      date: c.issuedAt!,
      summary: `${c.diagnosis} · ${c.fitForWork ? 'Fit' : 'Not fit'} · ${fmtDate(c.fromDate)}–${fmtDate(c.toDate)}`,
    })),
    ...e.referrals.filter((r) => r.issuedAt).map((r) => ({
      type: 'REFERRAL' as const,
      id: r.id,
      date: r.issuedAt!,
      summary: `→ ${r.referredTo} · ${r.urgency}`,
    })),
  ]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Patient summary card */}
      <div className="px-4 py-5 border-b border-slate-200 bg-white">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2.5">
          <User size={20} className="text-blue-600" />
        </div>
        <div className="text-[15px] font-bold text-slate-900 mb-1.5">
          {patient.firstName} {patient.lastName}
        </div>
        <div className="text-xs text-slate-500 leading-relaxed">
          <div>DOB: {fmtDate(patient.dob)}</div>
          {patient.phone && <div>Phone: {patient.phone}</div>}
          <div className="break-all">{patient.email}</div>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="flex-1 overflow-y-auto">
        <Section
          icon={<FileText size={13} />}
          title="Encounter History"
          count={patient.encounters.length}
          defaultOpen={patient.encounters.length > 0}
        >
          {patient.encounters.length === 0 ? (
            <p className="px-4 py-2 text-xs text-slate-500">
              No previous encounters.
            </p>
          ) : (
            patient.encounters.map((enc) => (
              <EncounterEntry key={enc.id} enc={enc} />
            ))
          )}
        </Section>

        <Section
          icon={<Pill size={13} />}
          title="Medication History"
          count={allPrescriptions.length}
        >
          {allPrescriptions.length === 0 ? (
            <p className="px-4 py-2 text-xs text-slate-500">
              No prescriptions on record.
            </p>
          ) : (
            allPrescriptions.map((p) => (
              <div
                key={p.id}
                className="mx-3 my-1 py-2 px-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm"
              >
                <div className="flex justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                      ${p.type === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                    `}
                  >
                    {p.type}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.issuedAt ? fmtDate(p.issuedAt) : ''}
                  </span>
                </div>
                {p.items.map((i, idx) => (
                  <div key={idx} className="text-slate-800 mb-0.5 font-medium">
                    {i.medicationName}
                    <span className="text-slate-500 font-normal"> · {i.dosage} · {i.frequency}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </Section>

        <Section
          icon={<Navigation size={13} />}
          title="Documents"
          count={allDocs.length}
        >
          {allDocs.length === 0 ? (
            <p className="px-4 py-2 text-xs text-slate-500">
              No documents issued.
            </p>
          ) : (
            allDocs.map((d) => (
              <div
                key={d.id}
                className="mx-3 my-1 py-2 px-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm"
              >
                <div className="flex justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                      ${d.type === 'CERTIFICATE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                    `}
                  >
                    {d.type}
                  </span>
                  <span className="text-[11px] text-slate-500">{fmtDate(d.date)}</span>
                </div>
                <div className="text-slate-700 font-medium">{d.summary}</div>
              </div>
            ))
          )}
        </Section>
      </div>
    </div>
  );
}
