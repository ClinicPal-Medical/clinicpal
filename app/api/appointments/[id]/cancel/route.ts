import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cancelAppointment } from "@/modules/appointments/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: appointmentId } = await params;
    const cancelled = await cancelAppointment(appointmentId, session.user.id);
    return NextResponse.json(cancelled);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel appointment" }, { status: 500 });
  }
}
