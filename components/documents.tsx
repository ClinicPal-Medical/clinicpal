'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus, Printer, Send, Trash2 } from 'lucide-react';

export type DocTone = 'blue' | 'emerald' | 'amber';

// ─── Tone maps ────────────────────────────────────────────────────────────────

const COUNT_BADGE_CLASSES: Record<DocTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
};

const ADD_BUTTON_CLASSES: Record<DocTone, string> = {
  blue: 'border-blue-300 bg-blue-50/50 text-blue-600 hover:bg-blue-50',
  emerald: 'border-emerald-300 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50',
  amber: 'border-amber-300 bg-amber-50/50 text-amber-600 hover:bg-amber-50',
};

const FORM_CONTAINER_CLASSES: Record<DocTone, string> = {
  blue: 'border-blue-200 bg-blue-50/50',
  emerald: 'border-emerald-200 bg-emerald-50/50',
  amber: 'border-amber-200 bg-amber-50/50',
};

const SAVE_BUTTON_CLASSES: Record<DocTone, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-500 hover:bg-amber-600',
};

const ISSUE_BUTTON_CLASSES: Record<DocTone, string> = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  emerald: 'bg-emerald-500 hover:bg-emerald-600',
  amber: 'bg-amber-500 hover:bg-amber-600',
};

// ─── DocumentPanel ────────────────────────────────────────────────────────────
// Collapsible outer wrapper used by Prescriptions / Certificates / Referrals.

export function DocumentPanel({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: DocTone;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between py-3 px-4 border-none cursor-pointer text-slate-600 transition-colors ${
          open ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${COUNT_BADGE_CLASSES[tone]}`}
          >
            {count}
          </span>
        </div>
      </button>
      {open && <div className="p-3 border-t border-slate-100 bg-slate-50/30">{children}</div>}
    </div>
  );
}

// ─── DocumentCard ─────────────────────────────────────────────────────────────
// Coloured container for a draft / issued / neutral document.

type CardVariant = 'draft' | 'issued' | 'neutral';

const CARD_CLASSES: Record<CardVariant, string> = {
  draft: 'border-amber-200 bg-amber-50/50',
  issued: 'border-emerald-200 bg-emerald-50/50',
  neutral: 'border-slate-200 bg-white shadow-sm',
};

export function DocumentCard({
  variant,
  children,
}: {
  variant: CardVariant;
  children: ReactNode;
}) {
  return <div className={`mb-2 p-3 rounded-xl border ${CARD_CLASSES[variant]}`}>{children}</div>;
}

// ─── DocActions ───────────────────────────────────────────────────────────────
// Print / Issue / Delete button cluster sitting in a card header.

export function DocActions({
  isDraft,
  issueTone,
  printHref,
  onIssue,
  onDelete,
  issuing,
  deleting,
  issuingLabel = 'Issuing…',
}: {
  isDraft: boolean;
  issueTone: DocTone;
  printHref?: string;
  onIssue?: () => void;
  onDelete?: () => void;
  issuing?: boolean;
  deleting?: boolean;
  issuingLabel?: string;
}) {
  return (
    <div className="flex gap-1.5">
      {!isDraft && printHref && (
        <button
          onClick={() => window.open(printHref, '_blank')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] cursor-pointer transition-colors"
        >
          <Printer size={12} /> Print
        </button>
      )}
      {isDraft && onIssue && (
        <button
          onClick={onIssue}
          disabled={issuing}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md border-none text-[11px] font-semibold text-white transition-colors ${
            issuing
              ? 'bg-slate-500 cursor-not-allowed'
              : `${ISSUE_BUTTON_CLASSES[issueTone]} cursor-pointer shadow-sm`
          }`}
        >
          <Send size={12} /> {issuing ? issuingLabel : 'Issue'}
        </button>
      )}
      {isDraft && onDelete && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md border bg-white text-[11px] transition-colors ${
            deleting
              ? 'border-red-200 text-red-400 cursor-not-allowed'
              : 'border-red-200 text-red-500 hover:bg-red-50 cursor-pointer'
          }`}
        >
          <Trash2 size={12} /> {deleting ? '…' : 'Delete'}
        </button>
      )}
    </div>
  );
}

// ─── DocumentDraftForm ────────────────────────────────────────────────────────
// Coloured form shell with Save/Cancel footer and inline error.

export function DocumentDraftForm({
  tone,
  onSave,
  onCancel,
  saving,
  error,
  children,
}: {
  tone: DocTone;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div className={`border rounded-xl p-4 mb-2 ${FORM_CONTAINER_CLASSES[tone]}`}>
      {children}

      {error && (
        <div className="mt-2 py-1.5 px-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-3">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className={`px-4 py-1.5 rounded-lg border-none text-xs font-semibold text-white transition-colors ${
            saving ? 'bg-slate-400 cursor-not-allowed' : `${SAVE_BUTTON_CLASSES[tone]} cursor-pointer shadow-sm`
          }`}
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
      </div>
    </div>
  );
}

// ─── AddDocumentButton ────────────────────────────────────────────────────────

export function AddDocumentButton({
  tone,
  onClick,
  children,
}: {
  tone: DocTone;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed text-xs font-bold cursor-pointer transition-colors ${ADD_BUTTON_CLASSES[tone]}`}
    >
      <Plus size={14} /> {children}
    </button>
  );
}
