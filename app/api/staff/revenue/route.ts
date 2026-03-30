import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as billingService from "@/modules/billing/service";

export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "") || new Date().getMonth() + 1;
  const year = parseInt(searchParams.get("year") || "") || new Date().getFullYear();

  const metrics = await billingService.getRevenueMetrics(month, year);
  return NextResponse.json(metrics);
}
