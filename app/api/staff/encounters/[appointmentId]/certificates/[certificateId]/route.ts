import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { deleteCertificate } from "@/modules/encounters/service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string; certificateId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId, certificateId } = await params;
  const result = await deleteCertificate(appointmentId, certificateId);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    if (result.error === "ALREADY_ISSUED")
      return NextResponse.json({ error: "Cannot delete an issued certificate" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
