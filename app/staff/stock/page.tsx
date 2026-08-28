"use client";

import { useState, useEffect } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  TextInput,
  DateInput,
  SelectInput,
  AutocompleteInput,
} from "@/components/form";

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

const addSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity must be 0 or more"),
  reorderThreshold: z
    .number({ error: "Reorder threshold is required" })
    .int("Reorder threshold must be a whole number")
    .min(0, "Reorder threshold must be 0 or more"),
  unitCost: z
    .number({ error: "Unit cost is required" })
    .positive("Must be a positive number"),
  supplier: z.string(),
  expiry: z.string(),
});

const adjustSchema = z.object({
  quantityDelta: z
    .number({ error: "Quantity delta is required" })
    .int("Quantity delta must be a whole number"),
  type: z.enum(["RECEIVED", "USED", "DISPOSED", "ADJUSTED"]),
  notes: z.string(),
});

type AddFormValues = z.infer<typeof addSchema>;
type AdjustFormValues = z.infer<typeof adjustSchema>;

const EMPTY_ADD_FORM: DefaultValues<AddFormValues> = {
  name: "",
  category: "",
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

  // ─── Add / Update modal ──────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const {
    control: controlAdd,
    handleSubmit: handleAddForm,
    reset: resetAdd,
    formState: { isSubmitting: addSubmitting },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: EMPTY_ADD_FORM,
  });

  const isUpdating = !!selectedItemId;

  // ─── Adjust modal ────────────────────────────────────────────────────────────
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<StockItem | null>(null);
  const [apiErrors, setApiErrors] = useState<Error | null>(null);

  const {
    control: controlAdjust,
    handleSubmit: handleAdjustForm,
    reset: resetAdjust,
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: "RECEIVED", notes: "" },
  });

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/staff/stock");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
    setSelectedItemId(null);
    resetAdd(EMPTY_ADD_FORM);
  };

  const searchStock = async (query: string): Promise<StockItem[]> => {
    const res = await fetch(
      `/api/staff/stock/search?q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return [];
    return res.json();
  };

  const selectSuggestion = (item: StockItem) => {
    setSelectedItemId(item.id);
    resetAdd({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
      unitCost: parseFloat(item.unitCost),
      supplier: item.supplier ?? "",
      expiry: item.expiry
        ? new Date(item.expiry).toISOString().split("T")[0]
        : "",
    });
  };

  const onAddSubmit = handleAddForm(async (values) => {
    const payload = {
      name: values.name.trim(),
      category: values.category.trim(),
      quantity: values.quantity,
      reorderThreshold: values.reorderThreshold,
      unitCost: values.unitCost,
      supplier: values.supplier.trim() || null,
      expiry: values.expiry ? new Date(values.expiry).toISOString() : null,
    };

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
    closeAddModal();
    fetchItems();
  });

  const onAdjustSubmit = handleAdjustForm(async (values) => {
    setApiErrors(null);
    try {
      const response = await fetch(
        `/api/staff/stock/${activeItem!.id}/adjust`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantityDelta: values.quantityDelta,
            type: values.type,
            notes: values.notes,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to adjust stock");
      }
      setIsAdjustOpen(false);
      fetchItems();
    } catch (e) {
      setApiErrors(e instanceof Error ? e : new Error("Unknown error"));
    }
  });

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
                  resetAdd(EMPTY_ADD_FORM);
                  setSelectedItemId(null);
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
                          resetAdjust({
                            type: "RECEIVED",
                            notes: "",
                          });
                          setApiErrors(null);
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
      <Modal open={isAddOpen} onClose={closeAddModal} onSubmit={onAddSubmit} maxWidth="lg">
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
            onClick={closeAddModal}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <AutocompleteInput
            control={controlAdd}
            name="name"
            label="Item Name *"
            fieldSize="sm"
            placeholder="Type to search or enter a new name…"
            onSearch={searchStock}
            onSelect={selectSuggestion}
            onUserChange={() => {
              if (selectedItemId) setSelectedItemId(null);
            }}
            getOptionKey={(s) => s.id}
            getOptionLabel={(s) => s.name}
            renderOption={(s) => (
              <>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.category} · {s.quantity} in stock
                  </p>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </>
            )}
            rightAdornment={
              isUpdating ? (
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  Existing
                </span>
              ) : undefined
            }
          />

          <TextInput
            control={controlAdd}
            name="category"
            label="Category *"
            fieldSize="sm"
            placeholder="e.g. Medications, Consumables…"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              control={controlAdd}
              name="quantity"
              type="float"
              decimals={0}
              fieldSize="sm"
              label="Quantity *"
              placeholder="0"
            />
            <TextInput
              control={controlAdd}
              name="reorderThreshold"
              type="float"
              decimals={0}
              fieldSize="sm"
              label="Reorder Threshold *"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              control={controlAdd}
              name="unitCost"
              type="currency"
              fieldSize="sm"
              label="Unit Cost *"
              placeholder="0.00"
            />
            <TextInput
              control={controlAdd}
              name="supplier"
              label="Supplier"
              fieldSize="sm"
              placeholder="Optional"
            />
          </div>

          <DateInput
            control={controlAdd}
            name="expiry"
            variant="date"
            label="Expiry Date"
            fieldSize="sm"
          />
        </div>

        <div className="flex space-x-3 justify-end mt-6">
          <Button type="button" variant="ghost" onClick={closeAddModal}>
            Cancel
          </Button>
          <Button type="submit" loading={addSubmitting} loadingText="Saving...">
            {isUpdating ? "Update Stock" : "Add New Stock"}
          </Button>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      {activeItem && (
        <Modal
          open={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          onSubmit={onAdjustSubmit}
          maxWidth="sm"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-1">Adjust Stock</h2>
          <p className="text-sm text-slate-500 mb-6">
            Updating levels for <span className="font-bold">{activeItem.name}</span>.
          </p>
          {apiErrors && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4">
              {apiErrors.message}
            </div>
          )}
          <div className="space-y-4 mb-6">
            <SelectInput
              control={controlAdjust}
              name="type"
              label="Transaction Type"
              fieldSize="sm"
              options={[
                { label: "Received Stock", value: "RECEIVED" },
                { label: "Used / Consumed", value: "USED" },
                { label: "Disposed / Expired", value: "DISPOSED" },
                { label: "Manual Adjustment", value: "ADJUSTED" },
              ]}
            />
            <TextInput
              control={controlAdjust}
              name="quantityDelta"
              type="float"
              decimals={0}
              fieldSize="sm"
              label="Quantity Delta"
              placeholder="e.g. 50 or -10"
            />
            <TextInput
              control={controlAdjust}
              name="notes"
              label="Notes (optional)"
              fieldSize="sm"
              placeholder="Reason for adjustment"
            />
          </div>

          <div className="flex space-x-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
