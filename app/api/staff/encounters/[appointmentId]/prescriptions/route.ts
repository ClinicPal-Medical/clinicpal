import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { createPrescription } from "@/modules/encounters/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId } = await params;
  const body = await req.json();

  const result = await createPrescription(appointmentId, auth.session.user.id, body);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    if (result.error === "UNRECOGNISED_ITEMS")
      return NextResponse.json(
        { error: "Unrecognised medication names", unrecognised: result.unrecognised },
        { status: 400 }
      );
  }

  return NextResponse.json(result, { status: 201 });
}
