'use client';

import { useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import {
  AddDocumentButton,
  DocActions,
  DocumentCard,
  DocumentDraftForm,
  DocumentPanel,
  docInputStyle,
} from '@/components/documents';
import type { ReferralData } from '@/modules/encounters/types';

type Urgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

function ReferralCard({
  referral,
  appointmentId,
  onUpdated,
  onDeleted,
}: {
  referral: ReferralData;
  appointmentId: string;
  onUpdated: (r: ReferralData) => void;
  onDeleted: (id: string) => void;
}) {
  const [issuing, setIssuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDraft = !referral.issuedAt;

  const handleIssue = async () => {
    setIssuing(true);
    const res = await fetch(
      `/api/staff/encounters/${appointmentId}/referrals/${referral.id}/issue`,
      { method: 'PATCH' },
    );
    if (res.ok) {
      const data = await res.json();
      onUpdated(data.referral);
    }
    setIssuing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/staff/encounters/${appointmentId}/referrals/${referral.id}`, {
      method: 'DELETE',
    });
    onDeleted(referral.id);
    setDeleting(false);
  };

  return (
    <DocumentCard variant={isDraft ? 'draft' : 'neutral'}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5">
          <StatusBadge status={referral.urgency} size="sm" />
          <StatusBadge status={isDraft ? 'DRAFT' : 'ISSUED'} size="sm" />
        </div>
        <DocActions
          isDraft={isDraft}
          issueTone="amber"
          printHref={!isDraft ? `/api/staff/print/referral/${referral.id}` : undefined}
          onIssue={handleIssue}
          onDelete={handleDelete}
          issuing={issuing}
          deleting={deleting}
          issuingLabel="…"
        />
      </div>
      <div className="text-xs text-slate-900 mb-0.5 font-bold">→ {referral.referredTo}</div>
      <div className="text-xs text-slate-700 leading-relaxed">{referral.reason}</div>
      {referral.notes && <div className="text-[11px] text-slate-500 mt-1 italic">{referral.notes}</div>}
    </DocumentCard>
  );
}

const URGENCY_TONES: Record<Urgency, string> = {
  ROUTINE: 'bg-blue-100 text-blue-700 border-blue-200',
  URGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
};

function AddReferralForm({
  appointmentId,
  onCreated,
  onCancel,
}: {
  appointmentId: string;
  onCreated: (r: ReferralData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    referredTo: '',
    reason: '',
    urgency: 'ROUTINE' as Urgency,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/encounters/${appointmentId}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      onCreated(data.referral);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const input = docInputStyle('amber');

  return (
    <DocumentDraftForm
      tone="amber"
      onSave={handleSave}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Refer To *</label>
          <input
            value={form.referredTo}
            onChange={(e) => setForm({ ...form, referredTo: e.target.value })}
            placeholder="e.g. ENT Specialist — City Hospital"
            className={input}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Reason *</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Reason for referral…"
            rows={2}
            className={`${input} resize-y`}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1.5">Urgency</label>
          <div className="flex gap-2">
            {(['ROUTINE', 'URGENT', 'EMERGENCY'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setForm({ ...form, urgency: u })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border ${
                  form.urgency === u
                    ? URGENCY_TONES[u]
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional context…"
            rows={2}
            className={`${input} resize-y`}
          />
        </div>
      </div>
    </DocumentDraftForm>
  );
}

export function ReferralsPanel({
  appointmentId,
  referrals,
  onReferralsChange,
}: {
  appointmentId: string;
  referrals: ReferralData[];
  onReferralsChange: (r: ReferralData[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <DocumentPanel title="Referrals" count={referrals.length} tone="amber">
      {referrals.length === 0 && !showForm && (
        <p className="text-xs text-slate-500 mb-3">No referrals yet.</p>
      )}
      {referrals.map((r) => (
        <ReferralCard
          key={r.id}
          referral={r}
          appointmentId={appointmentId}
          onUpdated={(updated) =>
            onReferralsChange(referrals.map((x) => (x.id === updated.id ? updated : x)))
          }
          onDeleted={(id) => onReferralsChange(referrals.filter((x) => x.id !== id))}
        />
      ))}
      {showForm ? (
        <AddReferralForm
          appointmentId={appointmentId}
          onCreated={(r) => {
            onReferralsChange([...referrals, r]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <AddDocumentButton tone="amber" onClick={() => setShowForm(true)}>
          Add Referral
        </AddDocumentButton>
      )}
    </DocumentPanel>
  );
}
