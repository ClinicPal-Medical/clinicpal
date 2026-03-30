import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as stockService from "@/modules/stock/service";

export async function GET() {
  const auth = await requireRole(["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response;

  const items = await stockService.getStockItems();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireRole(["NURSE", "DOCTOR", "ADMIN"]);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  if (body.expiry) body.expiry = new Date(body.expiry);
  const item = await stockService.createStockItem(body);
  return NextResponse.json(item);
}
