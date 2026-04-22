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
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 6,
    marginBottom: 0,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  col1: { flex: 2 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  col4: { flex: 1 },
  col5: { flex: 1 },
  col6: { flex: 2 },
  cellText: { fontSize: 9 },
  sectionLabel: {
    fontSize: 9,
    color: "#555555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 12,
  },
  notes: {
    fontSize: 9,
    color: "#333333",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 3,
    borderLeftColor: "#1e3a5f",
    borderLeftStyle: "solid",
    marginBottom: 16,
  },
  footer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    fontSize: 9,
    color: "#1e3a5f",
    fontStyle: "italic",
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

interface PrescriptionPDFProps {
  prescription: {
    id: string;
    type: string;
    notes: string | null;
    issuedAt: Date | null;
    items: {
      medicationName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      quantity: number;
      instructions: string | null;
    }[];
    doctor: { name: string; role: string };
    patient: { firstName: string; lastName: string; dob: Date };
  };
}

export function PrescriptionPDF({ prescription }: PrescriptionPDFProps) {
  const { doctor, patient } = prescription;
  const clinicName = process.env.CLINIC_NAME ?? "ClinicPal Medical Centre";
  const issuedDate = prescription.issuedAt
    ? new Date(prescription.issuedAt).toLocaleDateString("en-GB", {
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
          docTitle="Prescription"
          issueDate={issuedDate}
          doctorName={doctor.name}
          doctorRole={doctor.role}
          patientName={`${patient.firstName} ${patient.lastName}`}
          patientDob={patientDob}
        />

        {/* Medication table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.tableHeaderCell]}>Medication</Text>
            <Text style={[styles.col2, styles.tableHeaderCell]}>Dosage</Text>
            <Text style={[styles.col3, styles.tableHeaderCell]}>Frequency</Text>
            <Text style={[styles.col4, styles.tableHeaderCell]}>Duration</Text>
            <Text style={[styles.col5, styles.tableHeaderCell]}>Qty</Text>
            <Text style={[styles.col6, styles.tableHeaderCell]}>Instructions</Text>
          </View>
          {prescription.items.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.col1, styles.cellText]}>{item.medicationName}</Text>
              <Text style={[styles.col2, styles.cellText]}>{item.dosage}</Text>
              <Text style={[styles.col3, styles.cellText]}>{item.frequency}</Text>
              <Text style={[styles.col4, styles.cellText]}>{item.durationDays} days</Text>
              <Text style={[styles.col5, styles.cellText]}>{item.quantity}</Text>
              <Text style={[styles.col6, styles.cellText]}>
                {item.instructions ?? "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {prescription.notes && (
          <>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notes}>{prescription.notes}</Text>
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {prescription.type === "INTERNAL"
            ? `Dispensed by ${clinicName}.`
            : "To be dispensed by a registered pharmacy."}
        </Text>

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
