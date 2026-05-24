import prisma from "@/lib/db";
import { StockType } from "@prisma/client";

export async function getStockItems() {
  const items = await prisma.stockItem.findMany({
    orderBy: { name: "asc" },
  });

  return items.map((item) => {
    let status = "OK";
    if (item.quantity <= item.reorderThreshold / 2) status = "CRITICAL";
    else if (item.quantity <= item.reorderThreshold) status = "LOW";
    else if (
      item.expiry &&
      new Date(item.expiry).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    )
      status = "EXPIRING";

    return { ...item, status };
  });
}

export async function createStockItem(data: any) {
  return prisma.stockItem.create({ data });
}

export async function adjustStock(
  itemId: string,
  staffId: string,
  quantityDelta: number,
  type: StockType,
  notes?: string,
) {
  const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");

  const newQuantity =
    type === StockType.RECEIVED || type === StockType.ADJUSTED
      ? item.quantity + quantityDelta
      : item.quantity - quantityDelta;
  if (newQuantity < 0) throw new Error("Insufficient stock");

  const transaction = await prisma.stockTransaction.create({
    data: {
      itemId,
      staffId,
      type,
      quantityDelta,
      notes,
    },
  });

  const updatedItem = await prisma.stockItem.update({
    where: { id: itemId },
    data: { quantity: newQuantity },
  });

  return { updatedItem, transaction };
}

export async function updateStockItem(
  id: string,
  data: {
    name: string;
    category: string;
    quantity: number;
    reorderThreshold: number;
    unitCost: number;
    supplier?: string | null;
    expiry?: Date | null;
  },
) {
  return prisma.stockItem.update({ where: { id }, data });
}

export async function searchStockItems(q: string) {
  return prisma.stockItem.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 6,
  });
}

export async function deleteStockItem(itemId: string) {
  await prisma.stockTransaction.deleteMany({ where: { itemId } });
  return prisma.stockItem.delete({ where: { id: itemId } });
}
