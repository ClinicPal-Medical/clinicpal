import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { completeEncounter } from "@/modules/encounters/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { appointmentId } = await params;
  const result = await completeEncounter(appointmentId);

  if ("error" in result) {
    if (result.error === "NOT_FOUND")
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    if (result.error === "MISSING_FIELDS")
      return NextResponse.json(
        { error: "Chief complaint and diagnosis are required before completing" },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}
