import React from "react";
import { requireRole } from "@/lib/rbac";
import { getReferralForPrint } from "@/modules/encounters/service";
import { ReferralPDF } from "@/lib/pdf/ReferralPDF";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;
  const referral = await getReferralForPrint(id);

  if (!referral) return Response.json({ error: "Not found" }, { status: 404 });

  if (referral.doctorId !== auth.session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await renderToBuffer(
    React.createElement(ReferralPDF, { referral })
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="referral-${id}.pdf"`,
    },
  });
}
