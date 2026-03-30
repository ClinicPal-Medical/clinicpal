import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import prisma from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;
  const { status, notes } = await req.json();

  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { patient: true }});
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status }
  });

  // Append clinical notes to patient if provided by DOCTOR/ADMIN
  if (notes && (auth.session?.user?.role === 'DOCTOR' || auth.session?.user?.role === 'ADMIN')) {
    const existingNotes = appointment.patient.notes || '';
    const dateStr = new Date().toLocaleDateString();
    const newNotes = existingNotes 
      ? `${existingNotes}\n\n[${dateStr} - ${auth.session.user.name}]: ${notes}` 
      : `[${dateStr} - ${auth.session.user.name}]: ${notes}`;

    await prisma.patient.update({
      where: { id: appointment.patientId },
      data: { notes: newNotes }
    });
  }

  return NextResponse.json(updated);
}
