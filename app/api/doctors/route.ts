import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const doctors = await prisma.staff.findMany({
      where: {
        role: "DOCTOR",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialisation: true,
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
