'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Printer, Send, Trash2 } from 'lucide-react';
import type { ReferralData } from '@/modules/encounters/types';

const URGENCY_COLORS = {
  ROUTINE: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  URGENT: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  EMERGENCY: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

function inputStyle(): string {
  return "w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs outline-none transition-all focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20";
}

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
  const colors = URGENCY_COLORS[referral.urgency];

  const handleIssue = async () => {
    setIssuing(true);
    const res = await fetch(
      `/api/staff/encounters/${appointmentId}/referrals/${referral.id}/issue`,
      { method: 'PATCH' }
    );
    if (res.ok) {
      const data = await res.json();
      onUpdated(data.referral);
    }
    setIssuing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/staff/encounters/${appointmentId}/referrals/${referral.id}`, { method: 'DELETE' });
    onDeleted(referral.id);
    setDeleting(false);
  };

  return (
    <div className={`mb-2 p-3 rounded-xl border ${isDraft ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {referral.urgency}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDraft ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isDraft ? 'DRAFT' : 'ISSUED'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {!isDraft && (
            <button
              onClick={() => window.open(`/api/staff/print/referral/${referral.id}`, '_blank')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] cursor-pointer transition-colors"
            >
              <Printer size={12} /> Print
            </button>
          )}
          {isDraft && (
            <>
              <button
                onClick={handleIssue}
                disabled={issuing}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border-none text-[11px] font-semibold text-white transition-colors
                  ${issuing ? 'bg-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 cursor-pointer shadow-sm'}
                `}
              >
                <Send size={12} /> {issuing ? '…' : 'Issue'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border bg-white text-[11px] transition-colors
                  ${deleting ? 'border-red-200 text-red-400 cursor-not-allowed' : 'border-red-200 text-red-500 hover:bg-red-50 cursor-pointer'}
                `}
              >
                <Trash2 size={12} /> {deleting ? '…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-slate-900 mb-0.5 font-bold">→ {referral.referredTo}</div>
      <div className="text-xs text-slate-700 leading-relaxed">{referral.reason}</div>
      {referral.notes && <div className="text-[11px] text-slate-500 mt-1 italic">{referral.notes}</div>}
    </div>
  );
}

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
    urgency: 'ROUTINE' as 'ROUTINE' | 'URGENT' | 'EMERGENCY',
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
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      onCreated(data.referral);
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 mb-2">
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Refer To *</label>
          <input value={form.referredTo} onChange={(e) => setForm({ ...form, referredTo: e.target.value })} placeholder="e.g. ENT Specialist — City Hospital" className={inputStyle()} />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Reason *</label>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for referral…" rows={2} className={`${inputStyle()} resize-y`} />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1.5">Urgency</label>
          <div className="flex gap-2">
            {(['ROUTINE', 'URGENT', 'EMERGENCY'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setForm({ ...form, urgency: u })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border
                  ${form.urgency === u
                    ? `${URGENCY_COLORS[u].bg} ${URGENCY_COLORS[u].text} ${URGENCY_COLORS[u].border}`
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional context…" rows={2} className={`${inputStyle()} resize-y`} />
        </div>
      </div>

      {error && <div className="mt-2 py-1.5 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">{error}</div>}

      <div className="flex gap-2 justify-end mt-3">
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs cursor-pointer hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className={`px-4 py-1.5 rounded-lg border-none text-xs font-semibold text-white transition-colors ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 cursor-pointer shadow-sm'}`}>
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
      </div>
    </div>
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
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between py-3 px-4 border-none cursor-pointer text-slate-600 transition-colors
          ${open ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}
        `}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Referrals</span>
          <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{referrals.length}</span>
        </div>
      </button>

      {open && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/30">
          {referrals.length === 0 && !showForm && <p className="text-xs text-slate-500 mb-3">No referrals yet.</p>}
          {referrals.map((r) => (
            <ReferralCard
              key={r.id}
              referral={r}
              appointmentId={appointmentId}
              onUpdated={(updated) => onReferralsChange(referrals.map((x) => (x.id === updated.id ? updated : x)))}
              onDeleted={(id) => onReferralsChange(referrals.filter((x) => x.id !== id))}
            />
          ))}
          {showForm ? (
            <AddReferralForm
              appointmentId={appointmentId}
              onCreated={(r) => { onReferralsChange([...referrals, r]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-amber-600 text-xs font-bold cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <Plus size={14} /> Add Referral
            </button>
          )}
        </div>
      )}
    </div>
  );
}
