import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPatientAppointments, bookAppointment } from "@/modules/appointments/service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appointments = await getPatientAppointments(session.user.id);
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { staffId, scheduledAt, reason } = body;
    
    if (!staffId || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await bookAppointment(session.user.id, staffId, scheduledAt, reason || "");
    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to book appointment" }, { status: 500 });
  }
}
