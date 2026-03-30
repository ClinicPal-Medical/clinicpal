'use client';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', marginBottom: 30 },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, padding: 20, backgroundColor: '#f8fafc', borderRadius: 8 },
  kpiBox: { flex: 1 },
  kpiLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 8 },
  col1: { width: '40%', fontSize: 10, fontWeight: 'bold', color: '#475569' },
  col2: { width: '25%', fontSize: 10, fontWeight: 'bold', color: '#475569' },
  col3: { width: '20%', fontSize: 10, fontWeight: 'bold', color: '#475569' },
  col4: { width: '15%', fontSize: 10, fontWeight: 'bold', color: '#475569', textAlign: 'right' },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cellText: { fontSize: 10, color: '#334155' }
});

const ReportDocument = ({ metrics }: { metrics: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>ClinicPal Revenue Report</Text>
      <Text style={styles.meta}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
          <Text style={styles.kpiValue}>${metrics.mtdRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Outstanding</Text>
          <Text style={styles.kpiValue}>${metrics.outstandingBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Paid Invoices</Text>
          <Text style={styles.kpiValue}>{metrics.totalPaid}</Text>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.col1}>Patient Name</Text>
        <Text style={styles.col2}>Issued Date</Text>
        <Text style={styles.col3}>Status</Text>
        <Text style={styles.col4}>Amount</Text>
      </View>

      {metrics.invoices.map((inv: any) => (
        <View style={styles.row} key={inv.id}>
          <Text style={[styles.col1, styles.cellText]}>{inv.patient.firstName} {inv.patient.lastName}</Text>
          <Text style={[styles.col2, styles.cellText]}>{new Date(inv.issuedAt).toLocaleDateString()}</Text>
          <Text style={[styles.col3, styles.cellText]}>{inv.status}</Text>
          <Text style={[styles.col4, styles.cellText]}>${inv.amount.toFixed(2)}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export default function PDFExporter({ metrics }: { metrics: any }) {
  return (
    <PDFDownloadLink 
      document={<ReportDocument metrics={metrics} />} 
      fileName={`revenue-report-${new Date().toISOString().split('T')[0]}.pdf`}
      className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
    >
      {/* @ts-ignore */}
      {({ loading }) => loading ? 'Generating PDF...' : <><Download size={18} className="mr-2 inline" /> <span className="inline">Export PDF</span></>}
    </PDFDownloadLink>
  );
}
