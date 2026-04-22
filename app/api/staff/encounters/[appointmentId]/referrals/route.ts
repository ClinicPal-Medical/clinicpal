import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { createReferral } from "@/modules/encounters/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId } = await params;
  const body = await req.json();

  const result = await createReferral(appointmentId, auth.session.user.id, {
    referredTo: body.referredTo,
    reason: body.reason,
    urgency: body.urgency,
    notes: body.notes,
  });

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}
