import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as stockService from "@/modules/stock/service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;
  const { quantityDelta, type, notes } = await req.json();
  const staffId = auth.session!.user.id;

  try {
    const res = await stockService.adjustStock(id, staffId, quantityDelta, type, notes);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
