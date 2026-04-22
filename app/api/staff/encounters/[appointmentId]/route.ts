import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { getEncounterPage, updateEncounterFields } from "@/modules/encounters/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId } = await params;
  const result = await getEncounterPage(appointmentId, auth.session.user.id);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (result.error === "NOT_CONFIRMED")
      return NextResponse.json(
        { error: "Appointment status is not CONFIRMED" },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId } = await params;
  const body = await req.json();

  const result = await updateEncounterFields(appointmentId, body);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    if (result.error === "LOCKED")
      return NextResponse.json({ error: "Encounter is locked" }, { status: 409 });
  }

  return NextResponse.json(result);
}
