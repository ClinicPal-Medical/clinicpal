import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { issueReferral } from "@/modules/encounters/service";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string; referralId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId, referralId } = await params;
  const result = await issueReferral(appointmentId, referralId);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    if (result.error === "ALREADY_ISSUED")
      return NextResponse.json({ error: "Referral already issued" }, { status: 409 });
  }

  return NextResponse.json(result);
}
