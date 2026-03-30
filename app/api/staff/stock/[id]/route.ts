import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as stockService from "@/modules/stock/service";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;

  try {
    await stockService.deleteStockItem(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
