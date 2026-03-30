import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import prisma from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        include: { staff: true }
      },
      invoices: {
        orderBy: { issuedAt: 'desc' }
      }
    }
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = auth.session?.user?.role;
  const hideNotes = role !== "DOCTOR" && role !== "ADMIN";

  if (hideNotes) {
    const { notes, password, ...rest } = patient;
    return NextResponse.json(rest);
  }

  const { password, ...rest } = patient;
  return NextResponse.json(rest);
}
