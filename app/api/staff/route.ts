import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { DEFAULT_STAFF_PASSWORD } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    if (includeInactive) {
      const auth = await requireRole(["ADMIN"]);
      if (!auth.authorized) return auth.response!;

      const staff = await prisma.staff.findMany({
        orderBy: [{ active: "desc" }, { name: "asc" }],
      });
      const sanitized = staff.map(({ password: _, ...rest }) => rest);
      return NextResponse.json(sanitized);
    }

    const staff = await prisma.staff.findMany({
      where: { active: true },
    });
    return NextResponse.json(staff);
  } catch {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

const createStaffSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Invalid email").trim().toLowerCase(),
  role: z.nativeEnum(Role),
  specialisation: z.string().trim().optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, role, specialisation } = parsed.data;

  const existing = await prisma.staff.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_STAFF_PASSWORD, 10);

  const created = await prisma.staff.create({
    data: {
      name,
      email,
      role,
      specialisation: specialisation || null,
      password: passwordHash,
      active: false,
    },
  });

  const { password: _, ...safe } = created;
  return NextResponse.json(safe, { status: 201 });
}
