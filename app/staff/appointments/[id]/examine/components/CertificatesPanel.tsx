'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import StatusBadge from '@/components/StatusBadge';
import {
  AddDocumentButton,
  DocActions,
  DocumentCard,
  DocumentDraftForm,
  DocumentPanel,
  docInputStyle,
} from '@/components/documents';
import type { CertificateData } from '@/modules/encounters/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const today = () => new Date().toISOString().split('T')[0];

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
      { method: 'PATCH' },
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
    <DocumentCard variant={isDraft ? 'draft' : 'issued'}>
      <div className="flex justify-between items-start mb-2">
        <StatusBadge status={isDraft ? 'DRAFT' : 'ISSUED'} size="sm" />
        <DocActions
          isDraft={isDraft}
          issueTone="emerald"
          printHref={!isDraft ? `/api/staff/print/certificate/${cert.id}` : undefined}
          onIssue={handleIssue}
          onDelete={handleDelete}
          issuing={issuing}
          deleting={deleting}
          issuingLabel="…"
        />
      </div>
      <div className="text-xs text-slate-900 mb-1 font-bold">{cert.diagnosis}</div>
      <div className="text-[11px] text-slate-500">
        {cert.fitForWork ? '✓ Fit for work' : '✗ Not fit for work'} · {fmtDate(cert.fromDate)} – {fmtDate(cert.toDate)}
      </div>
      {cert.notes && <div className="text-[11px] text-slate-500 mt-1 italic">{cert.notes}</div>}
    </DocumentCard>
  );
}

type CertFormValues = {
  diagnosis: string;
  fitForWork: boolean;
  fromDate: string;
  toDate: string;
  notes: string;
};

function AddCertForm({
  appointmentId,
  onCreated,
  onCancel,
}: {
  appointmentId: string;
  onCreated: (c: CertificateData) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CertFormValues>({
    defaultValues: {
      diagnosis: '',
      fitForWork: false,
      fromDate: today(),
      toDate: today(),
      notes: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await fetch(`/api/staff/encounters/${appointmentId}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      onCreated(data.certificate);
    } catch {
      setError('Network error.');
    }
  });

  const input = docInputStyle('emerald');

  return (
    <DocumentDraftForm
      tone="emerald"
      onSave={onSubmit}
      onCancel={onCancel}
      saving={isSubmitting}
      error={error}
    >
      <div className="flex flex-col gap-2.5">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Diagnosis *</label>
          <input
            {...register('diagnosis', { required: true })}
            placeholder="e.g. Acute respiratory infection"
            className={input}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('fitForWork')}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Fit for work
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">From Date *</label>
            <input type="date" {...register('fromDate', { required: true })} className={input} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">To Date *</label>
            <input type="date" {...register('toDate', { required: true })} className={input} />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Notes (optional)</label>
          <textarea
            {...register('notes')}
            placeholder="Additional notes…"
            rows={2}
            className={`${input} resize-y`}
          />
        </div>
      </div>
    </DocumentDraftForm>
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
  const [showForm, setShowForm] = useState(false);

  return (
    <DocumentPanel title="Medical Certificates" count={certificates.length} tone="emerald">
      {certificates.length === 0 && !showForm && (
        <p className="text-xs text-slate-500 mb-3">No certificates yet.</p>
      )}
      {certificates.map((c) => (
        <CertCard
          key={c.id}
          cert={c}
          appointmentId={appointmentId}
          onUpdated={(updated) =>
            onCertificatesChange(certificates.map((x) => (x.id === updated.id ? updated : x)))
          }
          onDeleted={(id) => onCertificatesChange(certificates.filter((x) => x.id !== id))}
        />
      ))}
      {showForm ? (
        <AddCertForm
          appointmentId={appointmentId}
          onCreated={(c) => {
            onCertificatesChange([...certificates, c]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <AddDocumentButton tone="emerald" onClick={() => setShowForm(true)}>
          Add Certificate
        </AddDocumentButton>
      )}
    </DocumentPanel>
  );
}
