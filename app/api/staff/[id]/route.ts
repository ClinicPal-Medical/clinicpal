import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

const updateStaffSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.email().trim().toLowerCase().optional(),
    role: z.nativeEnum(Role).optional(),
    specialisation: z.string().trim().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "No fields to update",
  });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = parsed.data;

  if (data.email && data.email !== existing.email) {
    const conflict = await prisma.staff.findUnique({
      where: { email: data.email },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }
  }

  if (
    data.active === false &&
    existing.active &&
    existing.role === "ADMIN" &&
    existing.id === auth.session?.user?.id
  ) {
    return NextResponse.json(
      { error: "You cannot deactivate your own admin account" },
      { status: 400 },
    );
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.specialisation !== undefined && {
        specialisation: data.specialisation || null,
      }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });

  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}
