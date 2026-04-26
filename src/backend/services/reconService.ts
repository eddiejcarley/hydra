import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listDailyCloses(storeId: string, limit = 30) {
  return prisma.dailyClose.findMany({
    where: { storeId },
    orderBy: { closeDate: 'desc' },
    take: limit,
  });
}

export async function createDailyClose(storeId: string, data: {
  closeDate: string;
  totalSales: number;
  totalTax: number;
  cashSales: number;
  creditSales: number;
  debitSales: number;
  ebtSales: number;
  otherTenders: number;
}) {
  return prisma.dailyClose.create({
    data: { storeId, ...data, closeDate: new Date(data.closeDate) },
  });
}

export async function updateDailyClose(id: string, userId: string, data: {
  countedCash?: number;
  bankDeposit?: number;
  cashVariance?: number;
  varianceReason?: string;
  inventoryShrink?: number;
  fuelVariance?: number;
  status?: string;
}) {
  const close = await prisma.dailyClose.findUnique({ where: { id } });
  if (!close) throw new AppError(404, 'Daily close not found');

  const update: typeof data & { reconciledBy?: string; reconciledAt?: Date } = { ...data };
  if (data.status === 'RECONCILED') {
    update.reconciledBy = userId;
    update.reconciledAt = new Date();
  }

  return prisma.dailyClose.update({ where: { id }, data: update });
}

export async function createSpotCount(storeId: string, userId: string, data: {
  departmentId?: string;
  notes?: string;
  lines: { itemId: string; countedQty: number }[];
}) {
  const { lines, ...sessionData } = data;

  const itemIds = lines.map((l) => l.itemId);
  const inventories = await prisma.inventory.findMany({ where: { itemId: { in: itemIds } } });
  const qtyMap = new Map(inventories.map((inv) => [inv.itemId, inv.onHandQty]));

  return prisma.spotCountSession.create({
    data: {
      storeId,
      countedBy: userId,
      ...sessionData,
      lines: {
        create: lines.map((l) => ({
          itemId: l.itemId,
          countedQty: l.countedQty,
          systemQty: Number(qtyMap.get(l.itemId) ?? 0),
          variance: l.countedQty - Number(qtyMap.get(l.itemId) ?? 0),
        })),
      },
    },
    include: { lines: { include: { item: true } } },
  });
}

export async function listSpotCounts(storeId: string) {
  return prisma.spotCountSession.findMany({
    where: { storeId },
    include: { lines: { include: { item: true } } },
    orderBy: { countedAt: 'desc' },
    take: 50,
  });
}

export async function completeSpotCount(id: string) {
  const session = await prisma.spotCountSession.findUnique({ where: { id } });
  if (!session) throw new AppError(404, 'Spot count not found');

  return prisma.spotCountSession.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: { lines: { include: { item: true } } },
  });
}
