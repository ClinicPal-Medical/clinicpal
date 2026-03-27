import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      where: { active: true },
    });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}
