'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertTriangle, X } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import {
  AddDocumentButton,
  DocActions,
  DocumentCard,
  DocumentDraftForm,
  DocumentPanel,
  docInputStyle,
} from '@/components/documents';
import type { PrescriptionData, PrescriptionItemForm } from '@/modules/encounters/types';

const prescriptionItemSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string(),
  frequency: z.string(),
  durationDays: z.number().int().min(1, 'Min 1 day'),
  quantity: z.number().int().min(1, 'Min 1'),
  instructions: z.string(),
});

const prescriptionSchema = z.object({
  type: z.enum(['EXTERNAL', 'INTERNAL']),
  notes: z.string(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medication is required'),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

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
        { method: 'PATCH' },
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
        { method: 'DELETE' },
      );
      onDeleted(prescription.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DocumentCard variant={isDraft ? 'draft' : 'issued'}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5">
          <StatusBadge status={prescription.type} size="sm" />
          <StatusBadge status={isDraft ? 'DRAFT' : 'ISSUED'} size="sm" />
        </div>
        <DocActions
          isDraft={isDraft}
          issueTone="emerald"
          printHref={!isDraft ? `/api/staff/print/prescription/${prescription.id}` : undefined}
          onIssue={handleIssue}
          onDelete={handleDelete}
          issuing={issuing}
          deleting={deleting}
        />
      </div>

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
    </DocumentCard>
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
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: { ...EMPTY_FORM },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const type = watch('type');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await fetch(`/api/staff/encounters/${appointmentId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
    }
  });

  const input = docInputStyle('blue');

  return (
    <DocumentDraftForm
      tone="blue"
      onSave={onSubmit}
      onCancel={onCancel}
      saving={isSubmitting}
      error={error}
    >
      {/* Type toggle */}
      <div className="mb-3.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(['EXTERNAL', 'INTERNAL'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                type === t
                  ? t === 'INTERNAL'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-purple-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {type === 'INTERNAL' && (
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
        {fields.map((field, i) => (
          <div key={field.id} className="mb-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 mb-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Medication Name</label>
                <input
                  list={type === 'INTERNAL' ? 'stock-items-list' : undefined}
                  {...register(`items.${i}.medicationName` as const)}
                  placeholder={type === 'INTERNAL' ? 'Search stock items…' : 'Medication name…'}
                  className={input}
                />
                {errors.items?.[i]?.medicationName && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    {errors.items[i]?.medicationName?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Dosage</label>
                <input
                  {...register(`items.${i}.dosage` as const)}
                  placeholder="e.g. 500mg"
                  className={input}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Frequency</label>
                <input
                  {...register(`items.${i}.frequency` as const)}
                  placeholder="e.g. Twice daily"
                  className={input}
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${i}.durationDays` as const, { valueAsNumber: true })}
                  className={input}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${i}.quantity` as const, { valueAsNumber: true })}
                  className={input}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Instructions</label>
                <input
                  {...register(`items.${i}.instructions` as const)}
                  placeholder="Take with food…"
                  className={input}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                className={`p-2 rounded-md transition-colors self-end border border-transparent ${
                  fields.length === 1
                    ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100 cursor-pointer'
                }`}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ ...EMPTY_ITEM })}
          className="text-xs text-blue-600 bg-transparent border-none cursor-pointer py-1 flex items-center gap-1 hover:text-blue-700 font-medium"
        >
          <Plus size={13} /> Add another medication
        </button>
      </div>

      {/* Notes */}
      <div className="mb-3.5">
        <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
        <textarea
          {...register('notes')}
          placeholder="Dispensing or patient instructions…"
          className={`${input} min-h-[56px] resize-y`}
          rows={2}
        />
      </div>
    </DocumentDraftForm>
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
  const [showForm, setShowForm] = useState(false);

  return (
    <DocumentPanel title="Prescriptions" count={prescriptions.length} tone="blue">
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
        <AddDocumentButton tone="blue" onClick={() => setShowForm(true)}>
          Add Prescription
        </AddDocumentButton>
      )}
    </DocumentPanel>
  );
}
