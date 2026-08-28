"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Stethoscope, Plus, Search, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { TextInput, SelectInput } from "@/components/form";

type Role = "RECEPTIONIST" | "NURSE" | "DOCTOR" | "ADMIN";

type StaffRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialisation: string | null;
  active: boolean;
  createdAt: string;
};

const ROLE_OPTIONS = [
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Nurse", value: "NURSE" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Admin", value: "ADMIN" },
];

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email").min(1, "Email is required"),
  role: z.enum(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]),
  specialisation: z.string().optional(),
});
type StaffFormValues = z.infer<typeof staffSchema>;

type Props = {
  defaultPassword: string;
  currentUserId: string;
};

export default function StaffAdminClient({
  defaultPassword,
  currentUserId,
}: Props) {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const createForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "RECEPTIONIST",
      specialisation: "",
    },
  });

  const editForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "RECEPTIONIST",
      specialisation: "",
    },
  });

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff?includeInactive=true");
      if (!res.ok) throw new Error("Failed to load staff");
      const data = await res.json();
      setStaff(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.specialisation ?? "").toLowerCase().includes(q),
    );
  }, [staff, query]);

  const openEdit = (s: StaffRecord) => {
    setEditing(s);
    editForm.reset({
      name: s.name,
      email: s.email,
      role: s.role,
      specialisation: s.specialisation ?? "",
    });
  };

  const closeEdit = () => setEditing(null);

  const onCreate = async (values: StaffFormValues) => {
    setError(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        specialisation: values.specialisation || null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to create staff");
      return;
    }
    setCreateOpen(false);
    createForm.reset({
      name: "",
      email: "",
      role: "RECEPTIONIST",
      specialisation: "",
    });
    await fetchStaff();
  };

  const onEdit = async (values: StaffFormValues) => {
    if (!editing) return;
    setError(null);
    const res = await fetch(`/api/staff/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        specialisation: values.specialisation || null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to update staff");
      return;
    }
    closeEdit();
    await fetchStaff();
  };

  const toggleActive = async (s: StaffRecord) => {
    setError(null);
    setTogglingId(s.id);
    try {
      const res = await fetch(`/api/staff/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to update status");
        return;
      }
      await fetchStaff();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Staff Directory"
        subtitle="Create staff members, edit details, and manage access."
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Add Staff
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, role, or specialisation..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm">
                <th className="p-4 font-bold text-slate-600">Name</th>
                <th className="p-4 font-bold text-slate-600 hidden md:table-cell">
                  Email
                </th>
                <th className="p-4 font-bold text-slate-600">Role</th>
                <th className="p-4 font-bold text-slate-600">Status</th>
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
                    className="p-8 text-center text-slate-400 font-medium"
                  >
                    Loading staff...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 font-medium bg-slate-50/50"
                  >
                    No staff found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const initials = s.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  const isSelf = s.id === currentUserId;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {initials || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {s.name}
                              {isSelf && (
                                <span className="ml-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </p>
                            {s.specialisation && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {s.specialisation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="text-sm font-medium text-slate-700">
                          {s.email}
                        </p>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={s.role} size="sm" />
                      </td>
                      <td className="p-4">
                        <StatusBadge
                          status={s.active ? "ACTIVE" : "INACTIVE"}
                          tone={s.active ? "emerald" : "slate"}
                          size="sm"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEdit(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={s.active ? "danger" : "primary"}
                            size="sm"
                            loading={togglingId === s.id}
                            disabled={isSelf && s.active}
                            onClick={() => toggleActive(s)}
                          >
                            {s.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createForm.handleSubmit(onCreate)}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Add Staff Member
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              New accounts start as{" "}
              <span className="font-bold text-slate-700">inactive</span>. The
              default password is{" "}
              <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">
                {defaultPassword}
              </code>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <TextInput
            control={createForm.control}
            name="name"
            label="Full Name"
            leftIcon={User}
            placeholder="Jane Doe"
          />
          <TextInput
            control={createForm.control}
            name="email"
            type="email"
            label="Email"
            leftIcon={Mail}
            placeholder="jane@clinicpal.com"
            autoComplete="off"
          />
          <SelectInput
            control={createForm.control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
          />
          <TextInput
            control={createForm.control}
            name="specialisation"
            label="Specialisation (Optional)"
            leftIcon={Stethoscope}
            placeholder="e.g. General Practice"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={createForm.formState.isSubmitting}
            loadingText="Creating..."
          >
            Create Staff
          </Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={closeEdit}
        onSubmit={editForm.handleSubmit(onEdit)}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Edit Staff Member
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Update the details for this staff account.
            </p>
          </div>
          <button
            type="button"
            onClick={closeEdit}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <TextInput
            control={editForm.control}
            name="name"
            label="Full Name"
            leftIcon={User}
          />
          <TextInput
            control={editForm.control}
            name="email"
            type="email"
            label="Email"
            leftIcon={Mail}
            autoComplete="off"
          />
          <SelectInput
            control={editForm.control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
          />
          <TextInput
            control={editForm.control}
            name="specialisation"
            label="Specialisation (Optional)"
            leftIcon={Stethoscope}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" fullWidth onClick={closeEdit}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={editForm.formState.isSubmitting}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
