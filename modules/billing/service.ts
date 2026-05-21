import prisma from "@/lib/db";

export async function getRevenueMetrics(month: number, year: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { patient: true },
    orderBy: { issuedAt: "desc" },
  });

  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const unpaidInvoices = invoices.filter((i) => i.status === "UNPAID");

  const mtdRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const outstandingBalance = unpaidInvoices.reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const totalPaid = paidInvoices.length;
  const avgValue = totalPaid > 0 ? mtdRevenue / totalPaid : 0;

  // Compute 6-month historical chart
  const history = [];
  for (let i = 5; i >= 0; i--) {
    const historicalMonth = new Date(year, month - 1 - i, 1);
    const mName = historicalMonth.toLocaleString("default", { month: "short" });
    const historicalStart = new Date(
      historicalMonth.getFullYear(),
      historicalMonth.getMonth(),
      1,
    );
    const historicalEnd = new Date(
      historicalMonth.getFullYear(),
      historicalMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const mInvs = await prisma.invoice.findMany({
      where: {
        issuedAt: { gte: historicalStart, lte: historicalEnd },
        status: "PAID",
      },
    });
    const rev = mInvs.reduce((sum, inv) => sum + inv.amount, 0);
    history.push({ name: mName, total: rev });
  }

  return {
    mtdRevenue,
    outstandingBalance,
    totalPaid,
    avgValue,
    invoices,
    history,
  };
}

export async function markInvoicePaid(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });
}
