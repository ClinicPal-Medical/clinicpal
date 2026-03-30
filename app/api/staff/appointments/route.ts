import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const staffFilter = searchParams.get("staffId");

  let dateFilter = {};
  if (dateStr) {
    // Expects YYYY-MM-DD
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);
    dateFilter = {
      scheduledAt: { gte: startOfDay, lte: endOfDay }
    };
  }

  const where = {
    ...dateFilter,
    ...(staffFilter && staffFilter !== 'all' ? { staffId: staffFilter } : {})
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true, staff: true },
    orderBy: { scheduledAt: 'asc' }
  });

  return NextResponse.json(appointments);
}
