import React from "react";
import { requireRole } from "@/lib/rbac";
import { getCertificateForPrint } from "@/modules/encounters/service";
import { MedicalCertificatePDF } from "@/lib/pdf/MedicalCertificatePDF";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;
  const certificate = await getCertificateForPrint(id);

  if (!certificate)
    return Response.json({ error: "Not found" }, { status: 404 });

  if (certificate.doctorId !== auth.session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await renderToBuffer(
    React.createElement(MedicalCertificatePDF, { certificate })
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${id}.pdf"`,
    },
  });
}
