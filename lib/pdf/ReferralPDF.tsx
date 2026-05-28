import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { ClinicHeader } from "./ClinicHeader";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  urgencyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 20,
  },
  urgencyRoutine: { backgroundColor: "#dbeafe" },
  urgencyUrgent: { backgroundColor: "#fef3c7" },
  urgencyEmergency: { backgroundColor: "#fee2e2" },
  urgencyText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  urgencyTextRoutine: { color: "#1e40af" },
  urgencyTextUrgent: { color: "#92400e" },
  urgencyTextEmergency: { color: "#991b1b" },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  fieldLabel: {
    width: 120,
    fontSize: 8,
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  fieldValue: {
    flex: 1,
    fontSize: 10,
    color: "#111111",
  },
  notes: {
    fontSize: 9,
    color: "#333333",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 3,
    borderLeftColor: "#1e3a5f",
    borderLeftStyle: "solid",
    marginTop: 4,
    marginBottom: 32,
  },
  signatureLine: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    borderTopStyle: "solid",
    paddingTop: 8,
    width: 200,
  },
  signatureLabel: { fontSize: 8, color: "#777777" },
});

interface ReferralPDFProps {
  referral: {
    id: string;
    referredTo: string;
    reason: string;
    urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
    notes: string | null;
    issuedAt: Date | null;
    doctor: { name: string; role: string };
    patient: { firstName: string; lastName: string; dob: Date };
  };
}

const urgencyBadgeStyle = {
  ROUTINE: styles.urgencyRoutine,
  URGENT: styles.urgencyUrgent,
  EMERGENCY: styles.urgencyEmergency,
};
const urgencyTextStyle = {
  ROUTINE: styles.urgencyTextRoutine,
  URGENT: styles.urgencyTextUrgent,
  EMERGENCY: styles.urgencyTextEmergency,
};

export function ReferralPDF({ referral }: ReferralPDFProps) {
  const { doctor, patient } = referral;
  const issuedDate = referral.issuedAt
    ? new Date(referral.issuedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";
  const patientDob = new Date(patient.dob).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          docTitle="Referral Letter"
          issueDate={issuedDate}
          doctorName={doctor.name}
          doctorRole={doctor.role}
          patientName={`${patient.firstName} ${patient.lastName}`}
          patientDob={patientDob}
        />

        {/* Urgency badge */}
        <View style={[styles.urgencyBadge, urgencyBadgeStyle[referral.urgency]]}>
          <Text style={[styles.urgencyText, urgencyTextStyle[referral.urgency]]}>
            {referral.urgency}
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Referred To</Text>
          <Text style={styles.fieldValue}>{referral.referredTo}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Reason</Text>
          <Text style={styles.fieldValue}>{referral.reason}</Text>
        </View>

        {/* Notes */}
        {referral.notes && <Text style={styles.notes}>{referral.notes}</Text>}

        {/* Signature */}
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLabel}>
            {doctor.name} — {doctor.role}
          </Text>
          <Text style={styles.signatureLabel}>Authorised Signature</Text>
        </View>
      </Page>
    </Document>
  );
}
