import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { issuePrescription } from "@/modules/encounters/service";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string; prescriptionId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId, prescriptionId } = await params;
  const result = await issuePrescription(appointmentId, prescriptionId, auth.session.user.id);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    if (result.error === "ALREADY_ISSUED")
      return NextResponse.json({ error: "Prescription already issued" }, { status: 409 });
    if (result.error === "OUT_OF_STOCK")
      return NextResponse.json(
        { error: "Insufficient stock", outOfStockItems: result.outOfStockItems },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}
