import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import * as billingService from "@/modules/billing/service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;

  try {
    const res = await billingService.markInvoicePaid(id);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
