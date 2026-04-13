import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phone, dob, password } = await req.json();

    if (!firstName || !lastName || !email || !password || !dob) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.patient.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedDob = new Date(dob);

    const newPatient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        dob: parsedDob
      }
    });

    const { password: _, ...patientInfo } = newPatient;
    return NextResponse.json(patientInfo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
