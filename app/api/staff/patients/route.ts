import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        take: 1
      }
    },
    take: 50
  });

  const role = auth.session?.user?.role;
  const hideNotes = role !== "DOCTOR" && role !== "ADMIN";

  const sanitized = patients.map(p => {
    if (hideNotes) {
      const { notes, password, ...rest } = p;
      return rest;
    }
    const { password, ...rest } = p;
    return rest;
  });

  return NextResponse.json(sanitized);
}
