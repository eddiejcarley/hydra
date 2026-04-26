import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import eventBus from '../events/eventBus';
import { AppError } from '../middleware/errorHandler';

export async function listInventory(storeId: string, opts: { lowStock?: boolean; page?: number; limit?: number }) {
  const { lowStock, page = 1, limit = 50 } = opts;
  const items = await prisma.inventory.findMany({
    where: { item: { storeId } },
    include: { item: { include: { department: true, vendor: true } }, preferredVendor: true },
    orderBy: { item: { description: 'asc' } },
    skip: (page - 1) * limit,
    take: limit,
  });

  if (lowStock) {
    return items.filter((inv) => inv.onHandQty <= inv.reorderPoint);
  }
  return items;
}

export async function createTransaction(
  storeId: string,
  data: {
    itemId: string;
    transactionType: string;
    quantity: number;
    unitCost?: number;
    referenceNo?: string;
    reasonCode?: string;
    vendorId?: string;
  },
  userId: string
) {
  const inventory = await prisma.inventory.findUnique({ where: { itemId: data.itemId } });
  if (!inventory) throw new AppError(404, 'Inventory record not found for item');

  const tx = await prisma.$transaction(async (client) => {
    const transaction = await client.inventoryTransaction.create({
      data: { storeId, userId, ...data },
      include: { item: true },
    });

    await client.inventory.update({
      where: { itemId: data.itemId },
      data: { onHandQty: { increment: data.quantity } },
    });

    return transaction;
  });

  eventBus.emit('inventory.transaction', tx);
  return tx;
}

export async function listTransactions(storeId: string, opts: { itemId?: string; type?: string; page?: number; limit?: number }) {
  const { itemId, type, page = 1, limit = 50 } = opts;
  const where: Prisma.InventoryTransactionWhereInput = { storeId };
  if (itemId) where.itemId = itemId;
  if (type) where.transactionType = type;

  return prisma.inventoryTransaction.findMany({
    where,
    include: { item: true, vendor: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function upsertInventoryRecord(itemId: string, onHandQty: number, reorderPoint = 0) {
  return prisma.inventory.upsert({
    where: { itemId },
    update: { onHandQty, reorderPoint },
    create: { itemId, onHandQty, reorderPoint },
  });
}
