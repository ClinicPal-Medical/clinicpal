"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Calendar,
  Filter,
  Check,
  X,
  User,
  Stethoscope,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { TextareaInput } from "@/components/form";

export default function AppointmentsQueue() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffFilter, setStaffFilter] = useState("all");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAppt, setActiveAppt] = useState<any>(null);
  const {
    control: controlComplete,
    handleSubmit: handleCompleteForm,
    reset: resetCompleteForm,
  } = useForm<{ notes: string }>({ defaultValues: { notes: "" } });

  useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) =>
        setStaffList(data.filter((s: any) => s.role === "DOCTOR")),
      );
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [date, staffFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/staff/appointments?date=${date}&staffId=${staffFilter}`,
    );
    const data = await res.json();
    setAppointments(data);
    setLoading(false);
  };

  const updateStatus = async (
    id: string,
    newStatus: string,
    clinicalNotes?: string,
  ) => {
    await fetch(`/api/staff/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes: clinicalNotes }),
    });
    fetchAppointments();
  };

  const closeCompleteModal = () => {
    setIsModalOpen(false);
    setActiveAppt(null);
    resetCompleteForm({ notes: "" });
  };

  const onCompleteSubmit = handleCompleteForm(({ notes }) => {
    if (!activeAppt) return;
    updateStatus(activeAppt.id, "COMPLETED", notes);
    closeCompleteModal();
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Appointment Queue"
        subtitle="Manage and process scheduled visits."
        actions={
          <>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Doctors</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm pb-4">
                <th className="p-4 font-bold text-slate-600">Time</th>
                <th className="p-4 font-bold text-slate-600">Patient</th>
                <th className="p-4 font-bold text-slate-600">Doctor</th>
                <th className="p-4 font-bold text-slate-600">
                  Reason & Status
                </th>
                <th className="p-4 font-bold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-medium"
                  >
                    Loading queue...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-medium bg-slate-50/50"
                  >
                    No appointments found for this filter.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                      {new Date(appt.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        <User size={16} className="text-slate-400" />{" "}
                        {appt.patient.firstName} {appt.patient.lastName}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {appt.staff.name}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-800 mb-1">
                        {appt.reason}
                      </p>
                      <StatusBadge status={appt.status} size="sm" />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {appt.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(appt.id, "CONFIRMED")}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-xs rounded-lg transition-colors"
                          >
                            <Check size={14} className="mr-1" /> Accept
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, "CANCELLED")}
                            className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 font-bold text-xs rounded-lg transition-colors"
                          >
                            <X size={14} className="mr-1" /> Decline
                          </button>
                        </>
                      )}
                      {appt.status === "CONFIRMED" && (
                        <>
                          {role === "DOCTOR" && (
                            <Link
                              href={`/staff/appointments/${appt.id}/examine`}
                              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                            >
                              <Stethoscope size={14} className="mr-1" /> Begin
                              Examination
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setActiveAppt(appt);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs rounded-lg transition-colors"
                          >
                            <Check size={14} className="mr-1" /> Complete
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, "NO_SHOW")}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-xs rounded-lg transition-colors"
                          >
                            No Show
                          </button>
                        </>
                      )}
                      {(appt.status === "COMPLETED" ||
                        appt.status === "CANCELLED" ||
                        appt.status === "NO_SHOW") && (
                        <span className="text-xs font-bold text-slate-400">
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeCompleteModal}
        onSubmit={onCompleteSubmit}
        maxWidth="lg"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Complete Appointment
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Enter outcome notes for {activeAppt?.patient?.firstName}{" "}
          {activeAppt?.patient?.lastName}.
        </p>

        {role === "DOCTOR" || role === "ADMIN" ? (
          <div className="mb-6">
            <TextareaInput
              control={controlComplete}
              name="notes"
              label="Clinical Notes"
              placeholder="Record outcome, observations, prescriptions..."
              className="h-32 resize-none"
            />
          </div>
        ) : (
          <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl mb-6 font-medium">
            Clinical notes are classified for Doctors and Admins only. Mark
            as complete directly.
          </p>
        )}

        <div className="flex space-x-3 justify-end">
          <Button variant="ghost" type="button" onClick={closeCompleteModal}>
            Cancel
          </Button>
          <Button type="submit">Save & Complete</Button>
        </div>
      </Modal>
    </div>
  );
}
