'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Printer, Send, Trash2, AlertTriangle, X } from 'lucide-react';
import type { PrescriptionData, PrescriptionForm, PrescriptionItemForm } from '@/modules/encounters/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_ITEM: PrescriptionItemForm = {
  medicationName: '',
  dosage: '',
  frequency: '',
  durationDays: 7,
  quantity: 1,
  instructions: '',
};

const EMPTY_FORM: PrescriptionForm = {
  type: 'EXTERNAL',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

function inputStyle(error?: boolean): string {
  return `w-full px-2.5 py-1.5 bg-white border ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-lg text-slate-800 text-xs outline-none transition-all focus:ring-2`;
}

// ─── Prescription card ────────────────────────────────────────────────────────

function PrescriptionCard({
  prescription,
  appointmentId,
  onUpdated,
  onDeleted,
}: {
  prescription: PrescriptionData;
  appointmentId: string;
  onUpdated: (p: PrescriptionData) => void;
  onDeleted: (id: string) => void;
}) {
  const [issuing, setIssuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [outOfStock, setOutOfStock] = useState<string[]>([]);

  const isDraft = prescription.status === 'DRAFT';

  const handleIssue = async () => {
    setIssuing(true);
    setIssueError(null);
    setOutOfStock([]);
    try {
      const res = await fetch(
        `/api/staff/encounters/${appointmentId}/prescriptions/${prescription.id}/issue`,
        { method: 'PATCH' }
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.outOfStockItems) setOutOfStock(data.outOfStockItems);
        else setIssueError(data.error ?? 'Failed to issue prescription');
        return;
      }
      onUpdated(data.prescription);
    } catch {
      setIssueError('Network error. Please try again.');
    } finally {
      setIssuing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(
        `/api/staff/encounters/${appointmentId}/prescriptions/${prescription.id}`,
        { method: 'DELETE' }
      );
      onDeleted(prescription.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`mb-2 p-3 rounded-xl border ${isDraft ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prescription.type === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {prescription.type}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDraft ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isDraft ? 'DRAFT' : 'ISSUED'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {!isDraft && (
            <button
              onClick={() => window.open(`/api/staff/print/prescription/${prescription.id}`, '_blank')}
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
                  ${issuing ? 'bg-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'}
                `}
              >
                <Send size={12} /> {issuing ? 'Issuing…' : 'Issue'}
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

      {/* Medication items */}
      {prescription.items.map((item, i) => (
        <div key={i} className="text-xs text-slate-700 mb-1">
          <strong className="text-slate-900">{item.medicationName}</strong>
          <span className="text-slate-500">
            {' '}· {item.dosage} · {item.frequency} · {item.durationDays}d · Qty {item.quantity}
          </span>
          {item.instructions && (
            <span className="text-slate-500"> — {item.instructions}</span>
          )}
        </div>
      ))}
      {prescription.notes && (
        <div className="text-[11px] text-slate-500 mt-1.5 italic">
          Note: {prescription.notes}
        </div>
      )}

      {/* Out-of-stock error */}
      {outOfStock.length > 0 && (
        <div className="mt-2 py-2 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle size={12} />
          Out of stock: {outOfStock.join(', ')}
        </div>
      )}
      {issueError && (
        <div className="mt-2 py-1.5 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          {issueError}
        </div>
      )}
    </div>
  );
}

// ─── Add prescription form ────────────────────────────────────────────────────

function AddPrescriptionForm({
  appointmentId,
  stockItems,
  onCreated,
  onCancel,
}: {
  appointmentId: string;
  stockItems: { id: string; name: string; quantity: number }[];
  onCreated: (p: PrescriptionData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PrescriptionForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (index: number, field: keyof PrescriptionItemForm, value: string | number) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const addRow = () =>
    setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });

  const removeRow = (i: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/encounters/${appointmentId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.unrecognised)
          setError(`Unrecognised medications: ${data.unrecognised.join(', ')}`);
        else setError(data.error ?? 'Failed to save prescription');
        return;
      }
      onCreated(data.prescription);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 mb-2">
      {/* Type toggle */}
      <div className="mb-3.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(['EXTERNAL', 'INTERNAL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, type: t })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                ${form.type === t
                  ? (t === 'INTERNAL' ? 'bg-blue-500 text-white shadow-sm' : 'bg-purple-500 text-white shadow-sm')
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Datalist for INTERNAL type */}
      {form.type === 'INTERNAL' && (
        <datalist id="stock-items-list">
          {stockItems.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      )}

      {/* Medication rows */}
      <div className="mb-3">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Medications
        </label>
        {form.items.map((item, i) => (
          <div key={i} className="mb-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 mb-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Medication Name</label>
                <input
                  list={form.type === 'INTERNAL' ? 'stock-items-list' : undefined}
                  value={item.medicationName}
                  onChange={(e) => updateItem(i, 'medicationName', e.target.value)}
                  placeholder={form.type === 'INTERNAL' ? 'Search stock items…' : 'Medication name…'}
                  className={inputStyle()}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Dosage</label>
                <input
                  value={item.dosage}
                  onChange={(e) => updateItem(i, 'dosage', e.target.value)}
                  placeholder="e.g. 500mg"
                  className={inputStyle()}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Frequency</label>
                <input
                  value={item.frequency}
                  onChange={(e) => updateItem(i, 'frequency', e.target.value)}
                  placeholder="e.g. Twice daily"
                  className={inputStyle()}
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={item.durationDays}
                  onChange={(e) => updateItem(i, 'durationDays', Number(e.target.value))}
                  className={inputStyle()}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                  className={inputStyle()}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Instructions</label>
                <input
                  value={item.instructions}
                  onChange={(e) => updateItem(i, 'instructions', e.target.value)}
                  placeholder="Take with food…"
                  className={inputStyle()}
                />
              </div>
              <button
                onClick={() => removeRow(i)}
                disabled={form.items.length === 1}
                className={`p-2 rounded-md transition-colors self-end border border-transparent
                  ${form.items.length === 1 ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100 cursor-pointer'}
                `}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addRow}
          className="text-xs text-blue-600 bg-transparent border-none cursor-pointer py-1 flex items-center gap-1 hover:text-blue-700 font-medium"
        >
          <Plus size={13} /> Add another medication
        </button>
      </div>

      {/* Notes */}
      <div className="mb-3.5">
        <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Dispensing or patient instructions…"
          className={`${inputStyle()} min-h-[56px] resize-y`}
          rows={2}
        />
      </div>

      {error && (
        <div className="mb-2.5 py-2 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-1.5 rounded-lg border-none text-xs font-semibold text-white transition-colors
            ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm'}
          `}
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function PrescriptionsPanel({
  appointmentId,
  prescriptions,
  stockItems,
  onPrescriptionsChange,
}: {
  appointmentId: string;
  prescriptions: PrescriptionData[];
  stockItems: { id: string; name: string; quantity: number }[];
  onPrescriptionsChange: (p: PrescriptionData[]) => void;
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Prescriptions
          </span>
          <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            {prescriptions.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/30">
          {prescriptions.length === 0 && !showForm && (
            <p className="text-xs text-slate-500 mb-3">No prescriptions yet.</p>
          )}
          {prescriptions.map((p) => (
            <PrescriptionCard
              key={p.id}
              prescription={p}
              appointmentId={appointmentId}
              onUpdated={(updated) =>
                onPrescriptionsChange(prescriptions.map((x) => (x.id === updated.id ? updated : x)))
              }
              onDeleted={(id) =>
                onPrescriptionsChange(prescriptions.filter((x) => x.id !== id))
              }
            />
          ))}

          {showForm ? (
            <AddPrescriptionForm
              appointmentId={appointmentId}
              stockItems={stockItems}
              onCreated={(p) => {
                onPrescriptionsChange([...prescriptions, p]);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-blue-600 text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <Plus size={14} /> Add Prescription
            </button>
          )}
        </div>
      )}
    </div>
  );
}
