import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as stockService from "@/modules/stock/service";

export async function GET(req: Request) {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 3) return NextResponse.json([]);

  const items = await stockService.searchStockItems(q);
  return NextResponse.json(items);
}
