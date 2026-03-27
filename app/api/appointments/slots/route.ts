import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/modules/appointments/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date");

  if (!staffId || !date) {
    return NextResponse.json({ error: "Missing staffId or date" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(staffId, date);
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
