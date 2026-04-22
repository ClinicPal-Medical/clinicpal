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
  statusBanner: {
    padding: 14,
    marginBottom: 20,
    borderRadius: 4,
    alignItems: "center",
  },
  fitBanner: { backgroundColor: "#d1fae5" },
  notFitBanner: { backgroundColor: "#fee2e2" },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  fitText: { color: "#065f46" },
  notFitText: { color: "#991b1b" },
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

interface MedicalCertificatePDFProps {
  certificate: {
    id: string;
    diagnosis: string;
    fitForWork: boolean;
    fromDate: Date;
    toDate: Date;
    notes: string | null;
    issuedAt: Date | null;
    doctor: { name: string; role: string };
    patient: { firstName: string; lastName: string; dob: Date };
  };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function MedicalCertificatePDF({ certificate }: MedicalCertificatePDFProps) {
  const { doctor, patient } = certificate;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ClinicHeader
          docTitle="Medical Certificate"
          issueDate={certificate.issuedAt ? fmtDate(certificate.issuedAt) : "N/A"}
          doctorName={doctor.name}
          doctorRole={doctor.role}
          patientName={`${patient.firstName} ${patient.lastName}`}
          patientDob={fmtDate(patient.dob)}
        />

        {/* Fit-for-work status — displayed prominently */}
        <View
          style={[
            styles.statusBanner,
            certificate.fitForWork ? styles.fitBanner : styles.notFitBanner,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              certificate.fitForWork ? styles.fitText : styles.notFitText,
            ]}
          >
            {certificate.fitForWork ? "✓  FIT FOR WORK" : "✗  NOT FIT FOR WORK"}
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Diagnosis</Text>
          <Text style={styles.fieldValue}>{certificate.diagnosis}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Valid From</Text>
          <Text style={styles.fieldValue}>{fmtDate(certificate.fromDate)}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Valid To</Text>
          <Text style={styles.fieldValue}>{fmtDate(certificate.toDate)}</Text>
        </View>

        {/* Notes */}
        {certificate.notes && (
          <Text style={styles.notes}>{certificate.notes}</Text>
        )}

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
