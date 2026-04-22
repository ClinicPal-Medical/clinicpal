import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { deletePrescription } from "@/modules/encounters/service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string; prescriptionId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId, prescriptionId } = await params;
  const result = await deletePrescription(appointmentId, prescriptionId);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    if (result.error === "ALREADY_ISSUED")
      return NextResponse.json({ error: "Cannot delete an issued prescription" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
