"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

const PDFExporter = dynamic(() => import("./PDFExporter"), { ssr: false });

export default function RevenueDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/staff/revenue/?month=${new Date().getMonth()}&year=${new Date().getFullYear()}`,
    );
    if (res.ok) {
      const data = await res.json();
      setMetrics(data);
    } else {
      setMetrics(false);
    }
    setLoading(false);
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/staff/invoices/${id}/pay`, { method: "PATCH" });
    fetchMetrics();
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading financial data...
      </div>
    );
  if (metrics === false)
    return (
      <div className="p-8 text-center font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 mt-10">
        Access Denied. Admins restricted only.
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Revenue & Billing"
        subtitle="Month-to-date financial overview and invoice tracking."
        actions={<PDFExporter metrics={metrics} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} tone="emerald" label="MTD Revenue" value={`$${metrics.mtdRevenue.toFixed(2)}`} />
        <StatCard icon={AlertCircle} tone="amber" label="Outstanding Bal" value={`$${metrics.outstandingBalance.toFixed(2)}`} />
        <StatCard icon={CheckCircle2} tone="blue" label="Paid Invoices" value={metrics.totalPaid} />
        <StatCard icon={FileText} tone="purple" label="Average Value" value={`$${metrics.avgValue.toFixed(2)}`} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          6-Month Revenue History
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.history}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dx={-10}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Bar
                dataKey="total"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm pb-4">
                <th className="p-4 font-bold text-slate-600">Patient</th>
                <th className="p-4 font-bold text-slate-600">Issued On</th>
                <th className="p-4 font-bold text-slate-600">Amount</th>
                <th className="p-4 font-bold text-slate-600">Status</th>
                <th className="p-4 font-bold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 font-medium bg-slate-50/50"
                  >
                    No invoices generated this month.
                  </td>
                </tr>
              ) : (
                metrics.invoices.map((inv: any) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4 font-bold text-slate-800">
                      {inv.patient.firstName} {inv.patient.lastName}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      ${inv.amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {inv.status === "UNPAID" && (
                        <button
                          onClick={() => markPaid(inv.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs rounded-lg transition-colors"
                        >
                          <Check size={14} className="mr-1" /> Mark Paid
                        </button>
                      )}
                      <button className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-lg transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
