// ─── Encounter Types ───────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the encounter workflow.
// These mirror Prisma output shapes to avoid importing Prisma types in client
// components (which would pull in Node-only code).

export interface PrescriptionItemData {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string | null;
}

export interface PrescriptionData {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  type: "INTERNAL" | "EXTERNAL";
  status: "DRAFT" | "ISSUED";
  notes: string | null;
  issuedAt: string | null; // serialised as ISO string from server
  createdAt: string;
  items: PrescriptionItemData[];
}

export interface CertificateData {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  fitForWork: boolean;
  fromDate: string;
  toDate: string;
  notes: string | null;
  issuedAt: string | null;
  createdAt: string;
}

export interface ReferralData {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  referredTo: string;
  reason: string;
  urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
  notes: string | null;
  issuedAt: string | null;
  createdAt: string;
}

export interface EncounterData {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string | null;
  examination: string | null;
  diagnosis: string | null;
  plan: string | null;
  createdAt: string;
  updatedAt: string;
  prescriptions: PrescriptionData[];
  certificates: CertificateData[];
  referrals: ReferralData[];
}

// ─── Patient Context (left column) ────────────────────────────────────────────

export interface PastEncounterData {
  id: string;
  createdAt: string;
  chiefComplaint: string | null;
  examination: string | null;
  diagnosis: string | null;
  plan: string | null;
  prescriptions: PrescriptionData[];
  certificates: CertificateData[];
  referrals: ReferralData[];
}

export interface PatientContextData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string | null;
  email: string;
  encounters: PastEncounterData[];
}

// ─── API response shape ───────────────────────────────────────────────────────

export interface EncounterPageData {
  encounter: EncounterData;
  appointment: {
    id: string;
    scheduledAt: string;
    reason: string | null;
    staffId: string;
  };
  patient: PatientContextData;
  stockItems: { id: string; name: string; quantity: number }[];
  nextPatient: { patientName: string; scheduledAt: string } | null;
  doctorName: string;
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface PrescriptionItemForm {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string;
}

export interface PrescriptionForm {
  type: "INTERNAL" | "EXTERNAL";
  notes: string;
  items: PrescriptionItemForm[];
}

export interface CertificateForm {
  diagnosis: string;
  fitForWork: boolean;
  fromDate: string;
  toDate: string;
  notes: string;
}

export interface ReferralForm {
  referredTo: string;
  reason: string;
  urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
  notes: string;
}
