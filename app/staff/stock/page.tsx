"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
} from "lucide-react";
import { ca, el, tr } from "date-fns/locale";
import { set } from "date-fns";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderThreshold: number;
  unitCost: string;
  supplier: string | null;
  expiry: string | null;
  status: string;
};

type FormState = {
  name: string;
  category: string;
  quantity: string;
  reorderThreshold: string;
  unitCost: string;
  supplier: string;
  expiry: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  quantity: "",
  reorderThreshold: "",
  unitCost: "",
  supplier: "",
  expiry: "",
};

export default function StockInventory() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const canManageStock = ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"].includes(
    role ?? "",
  );

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjust modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<StockItem | null>(null);
  const [quantityDelta, setQuantityDelta] = useState("");
  const [type, setType] = useState("RECEIVED");
  const [notes, setNotes] = useState("");

  // Add / Update modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StockItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<Error | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  // Live name search — triggers after 3 chars when no item is already selected
  useEffect(() => {
    if (selectedItemId || form.name.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/staff/stock/search?q=${encodeURIComponent(form.name)}`,
        );
        if (res.ok) {
          const data: StockItem[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.name, selectedItemId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/staff/stock");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const resetAddForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSelectedItemId(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const selectSuggestion = (item: StockItem) => {
    setSelectedItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      reorderThreshold: String(item.reorderThreshold),
      unitCost: String(parseFloat(item.unitCost)),
      supplier: item.supplier ?? "",
      expiry: item.expiry
        ? new Date(item.expiry).toISOString().split("T")[0]
        : "",
    });
    setFormErrors({});
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    if (selectedItemId) setSelectedItemId(null);
    setForm((prev) => ({ ...prev, name: value }));
  };

  const validateForm = (): Partial<FormState> => {
    const errors: Partial<FormState> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.category.trim()) errors.category = "Category is required";

    const qty = Number(form.quantity);
    if (
      form.quantity === "" ||
      isNaN(qty) ||
      !Number.isInteger(qty) ||
      qty < 0
    ) {
      errors.quantity = "Quantity must be a whole number (0 or more)";
    }

    const threshold = Number(form.reorderThreshold);
    if (
      form.reorderThreshold === "" ||
      isNaN(threshold) ||
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      errors.reorderThreshold = "Must be a whole number (0 or more)";
    }

    const cost = Number(form.unitCost);
    if (form.unitCost === "" || isNaN(cost) || cost <= 0) {
      errors.unitCost = "Must be a positive number";
    }

    return errors;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      quantity: parseInt(form.quantity),
      reorderThreshold: parseInt(form.reorderThreshold),
      unitCost: parseFloat(form.unitCost),
      supplier: form.supplier.trim() || null,
      expiry: form.expiry ? new Date(form.expiry).toISOString() : null,
    };

    try {
      if (selectedItemId) {
        await fetch(`/api/staff/stock/${selectedItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/staff/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsAddOpen(false);
      resetAddForm();
      fetchItems();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors(null);

    try {
      const response = await fetch(
        `/api/staff/stock/${activeItem!.id}/adjust`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantityDelta: parseInt(quantityDelta),
            type,
            notes,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to adjust stock");
      } else {
        setIsAdjustOpen(false);
        fetchItems();
      }
    } catch (e) {
      setApiErrors(e instanceof Error ? e : new Error("Unknown error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item completely?"))
      return;
    await fetch(`/api/staff/stock/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Category",
      "Quantity",
      "Reorder Threshold",
      "Unit Cost",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...items.map(
        (i) =>
          `"${i.name}","${i.category}",${i.quantity},${i.reorderThreshold},${i.unitCost},"${i.status}"`,
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinicpal-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalItems = items.length;
  const lowCriticalCount = items.filter(
    (i) => i.status === "LOW" || i.status === "CRITICAL",
  ).length;
  const expiringCount = items.filter((i) => i.status === "EXPIRING").length;

  const isUpdating = !!selectedItemId;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Inventory & Stock"
        subtitle="Manage supplies, monitor levels, and adjust counts."
        actions={
          <>
            {canManageStock && (
              <button
                onClick={() => {
                  resetAddForm();
                  setIsAddOpen(true);
                }}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
              >
                <Plus size={18} className="mr-2" /> Add Stock
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
            >
              <Download size={18} className="mr-2" /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Package} tone="blue" label="Total Unique Items" value={totalItems} />
        <StatCard icon={AlertTriangle} tone="red" label="Low & Critical" value={lowCriticalCount} />
        <StatCard icon={Clock} tone="amber" label="Expiring Soon" value={expiringCount} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm pb-4">
                <th className="p-4 font-bold text-slate-600">Item</th>
                <th className="p-4 font-bold text-slate-600">Quantity</th>
                <th className="p-4 font-bold text-slate-600">Cost</th>
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
                    Loading inventory...
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{i.name}</p>
                      <p className="text-sm text-slate-500 font-medium mt-0.5">
                        {i.category}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{i.quantity}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        TH: {i.reorderThreshold}
                      </p>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      ${parseFloat(i.unitCost).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={i.status}
                        size="sm"
                        className={i.status === "CRITICAL" ? "animate-pulse" : ""}
                      />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setActiveItem(i);
                          setQuantityDelta("");
                          setType("RECEIVED");
                          setNotes("");
                          setIsAdjustOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors"
                      >
                        <Edit3 size={14} className="mr-1" /> Adjust
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(i.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Update Stock Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-300"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isUpdating ? "Update Stock Item" : "Add New Stock Item"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isUpdating
                    ? "Editing an existing item — changes will be saved to the record."
                    : "Search for an existing item or fill in details to add a new one."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  resetAddForm();
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name with live search */}
              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="Type to search or enter a new name…"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() =>
                      suggestions.length > 0 && setShowSuggestions(true)
                    }
                    className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 pr-9 ${formErrors.name ? "border-red-300" : "border-slate-200"}`}
                  />
                  {searchLoading && (
                    <Loader2
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
                    />
                  )}
                  {isUpdating && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                      Existing
                    </span>
                  )}
                </div>
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {formErrors.name}
                  </p>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {s.category} · {s.quantity} in stock
                          </p>
                        </div>
                        <StatusBadge status={s.status} size="sm" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medications, Consumables…"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 ${formErrors.category ? "border-red-300" : "border-slate-200"}`}
                />
                {formErrors.category && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {formErrors.category}
                  </p>
                )}
              </div>

              {/* Quantity + Reorder Threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 ${formErrors.quantity ? "border-red-300" : "border-slate-200"}`}
                  />
                  {formErrors.quantity && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {formErrors.quantity}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Reorder Threshold <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.reorderThreshold}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        reorderThreshold: e.target.value,
                      }))
                    }
                    className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 ${formErrors.reorderThreshold ? "border-red-300" : "border-slate-200"}`}
                  />
                  {formErrors.reorderThreshold && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {formErrors.reorderThreshold}
                    </p>
                  )}
                </div>
              </div>

              {/* Unit Cost + Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Unit Cost ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.unitCost}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, unitCost: e.target.value }))
                    }
                    className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 ${formErrors.unitCost ? "border-red-300" : "border-slate-200"}`}
                  />
                  {formErrors.unitCost && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {formErrors.unitCost}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.supplier}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, supplier: e.target.value }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiry}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expiry: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="flex space-x-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  resetAddForm();
                }}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-colors text-sm flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {isUpdating ? "Update Stock" : "Add New Stock"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-300"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Adjust Stock
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Updating levels for{" "}
              <span className="font-bold">{activeItem.name}</span>.
            </p>
            {apiErrors && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4">
                {apiErrors.message}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  <option value="RECEIVED">Received Stock</option>
                  <option value="USED">Used / Consumed</option>
                  <option value="DISPOSED">Disposed / Expired</option>
                  <option value="ADJUSTED">Manual Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Quantity Delta
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -10"
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for adjustment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
