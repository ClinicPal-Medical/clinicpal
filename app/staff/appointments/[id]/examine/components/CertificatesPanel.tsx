'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Printer, Send, Trash2 } from 'lucide-react';
import type { CertificateData } from '@/modules/encounters/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const today = () => new Date().toISOString().split('T')[0];

function inputStyle(): string {
  return "w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs outline-none transition-all focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20";
}

function CertCard({
  cert,
  appointmentId,
  onUpdated,
  onDeleted,
}: {
  cert: CertificateData;
  appointmentId: string;
  onUpdated: (c: CertificateData) => void;
  onDeleted: (id: string) => void;
}) {
  const [issuing, setIssuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDraft = !cert.issuedAt;

  const handleIssue = async () => {
    setIssuing(true);
    const res = await fetch(
      `/api/staff/encounters/${appointmentId}/certificates/${cert.id}/issue`,
      { method: 'PATCH' }
    );
    if (res.ok) {
      const data = await res.json();
      onUpdated(data.certificate);
    }
    setIssuing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/staff/encounters/${appointmentId}/certificates/${cert.id}`, {
      method: 'DELETE',
    });
    onDeleted(cert.id);
    setDeleting(false);
  };

  return (
    <div className={`mb-2 p-3 rounded-xl border ${isDraft ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDraft ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isDraft ? 'DRAFT' : 'ISSUED'}
        </span>
        <div className="flex gap-1.5">
          {!isDraft && (
            <button
              onClick={() => window.open(`/api/staff/print/certificate/${cert.id}`, '_blank')}
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
                  ${issuing ? 'bg-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer shadow-sm'}
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
      <div className="text-xs text-slate-900 mb-1 font-bold">
        {cert.diagnosis}
      </div>
      <div className="text-[11px] text-slate-500">
        {cert.fitForWork ? '✓ Fit for work' : '✗ Not fit for work'} · {fmtDate(cert.fromDate)} – {fmtDate(cert.toDate)}
      </div>
      {cert.notes && <div className="text-[11px] text-slate-500 mt-1 italic">{cert.notes}</div>}
    </div>
  );
}

function AddCertForm({
  appointmentId,
  onCreated,
  onCancel,
}: {
  appointmentId: string;
  onCreated: (c: CertificateData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    diagnosis: '',
    fitForWork: false,
    fromDate: today(),
    toDate: today(),
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/encounters/${appointmentId}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      onCreated(data.certificate);
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  return (
    <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50 mb-2">
      <div className="flex flex-col gap-2.5">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Diagnosis *</label>
          <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Acute respiratory infection" className={inputStyle()} />
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.fitForWork} onChange={(e) => setForm({ ...form, fitForWork: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Fit for work
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">From Date *</label>
            <input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} className={inputStyle()} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">To Date *</label>
            <input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} className={inputStyle()} />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes…" rows={2} className={`${inputStyle()} resize-y`} />
        </div>
      </div>

      {error && <div className="mt-2 py-1.5 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">{error}</div>}

      <div className="flex gap-2 justify-end mt-3">
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs cursor-pointer hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className={`px-4 py-1.5 rounded-lg border-none text-xs font-semibold text-white transition-colors ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm'}`}>
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
      </div>
    </div>
  );
}

export function CertificatesPanel({
  appointmentId,
  certificates,
  onCertificatesChange,
}: {
  appointmentId: string;
  certificates: CertificateData[];
  onCertificatesChange: (c: CertificateData[]) => void;
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Medical Certificates</span>
          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{certificates.length}</span>
        </div>
      </button>

      {open && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/30">
          {certificates.length === 0 && !showForm && <p className="text-xs text-slate-500 mb-3">No certificates yet.</p>}
          {certificates.map((c) => (
            <CertCard
              key={c.id}
              cert={c}
              appointmentId={appointmentId}
              onUpdated={(updated) => onCertificatesChange(certificates.map((x) => (x.id === updated.id ? updated : x)))}
              onDeleted={(id) => onCertificatesChange(certificates.filter((x) => x.id !== id))}
            />
          ))}
          {showForm ? (
            <AddCertForm
              appointmentId={appointmentId}
              onCreated={(c) => { onCertificatesChange([...certificates, c]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-600 text-xs font-bold cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              <Plus size={14} /> Add Certificate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
