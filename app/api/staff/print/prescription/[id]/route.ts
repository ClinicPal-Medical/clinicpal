import { requireRole } from "@/lib/rbac";
import { getPrescriptionForPrint } from "@/modules/encounters/service";
import { PrescriptionPDF } from "@/lib/pdf/PrescriptionPDF";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["DOCTOR"]);
  if (!auth.authorized) return auth.response!;

  const { id } = await params;
  const prescription = await getPrescriptionForPrint(id);

  if (!prescription)
    return Response.json({ error: "Not found" }, { status: 404 });

  if (prescription.doctorId !== auth.session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await renderToBuffer(PrescriptionPDF({ prescription }));

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="prescription-${id}.pdf"`,
    },
  });
}
