import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    borderBottomStyle: "solid",
  },
  clinicName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1e3a5f",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: "#111111",
    fontWeight: "bold",
  },
});

interface ClinicHeaderProps {
  docTitle: string;
  issueDate: string;
  doctorName: string;
  doctorRole: string;
  patientName: string;
  patientDob: string;
}

export function ClinicHeader({
  docTitle,
  issueDate,
  doctorName,
  doctorRole,
  patientName,
  patientDob,
}: ClinicHeaderProps) {
  const clinicName = process.env.CLINIC_NAME ?? "ClinicPal Medical Centre";
  const clinicAddress = process.env.CLINIC_ADDRESS ?? "Medical City";

  return (
    <View style={styles.header}>
      <Text style={styles.clinicName}>{clinicName}</Text>
      <Text style={styles.clinicAddress}>{clinicAddress}</Text>
      <Text style={styles.docTitle}>{docTitle}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Patient</Text>
          <Text style={styles.metaValue}>{patientName}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Date of Birth</Text>
          <Text style={styles.metaValue}>{patientDob}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Issuing Doctor</Text>
          <Text style={styles.metaValue}>
            {doctorName} — {doctorRole}
          </Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Date of Issue</Text>
          <Text style={styles.metaValue}>{issueDate}</Text>
        </View>
      </View>
    </View>
  );
}
