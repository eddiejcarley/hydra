import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listTanks(storeId: string) {
  return prisma.fuelTank.findMany({
    where: { storeId },
    include: { pumps: true, item: true },
    orderBy: { tankNumber: 'asc' },
  });
}

export async function createTank(storeId: string, data: {
  tankNumber: number;
  productGrade: string;
  capacity: number;
  itemId?: string;
}) {
  return prisma.fuelTank.create({ data: { storeId, ...data } });
}

export async function updateTank(id: string, data: {
  productGrade?: string;
  capacity?: number;
  currentVolume?: number;
  itemId?: string;
}) {
  const tank = await prisma.fuelTank.findUnique({ where: { id } });
  if (!tank) throw new AppError(404, 'Tank not found');
  return prisma.fuelTank.update({ where: { id }, data });
}

export async function logDelivery(storeId: string, userId: string, data: {
  tankId: string;
  deliveryDate: string;
  supplier: string;
  bolNumber?: string;
  gallons: number;
  costPerGallon?: number;
}) {
  const tank = await prisma.fuelTank.findUnique({ where: { id: data.tankId } });
  if (!tank) throw new AppError(404, 'Tank not found');

  const [delivery] = await prisma.$transaction([
    prisma.fuelDelivery.create({
      data: { storeId, userId, ...data, deliveryDate: new Date(data.deliveryDate) },
    }),
    prisma.fuelTank.update({
      where: { id: data.tankId },
      data: { currentVolume: { increment: data.gallons } },
    }),
  ]);

  return delivery;
}

export async function listDeliveries(storeId: string, tankId?: string) {
  return prisma.fuelDelivery.findMany({
    where: { storeId, ...(tankId && { tankId }) },
    include: { tank: true },
    orderBy: { deliveryDate: 'desc' },
  });
}

export async function logReading(storeId: string, userId: string, data: {
  tankId: string;
  gaugeReading: number;
  temperature?: number;
}) {
  const tank = await prisma.fuelTank.findUnique({ where: { id: data.tankId } });
  if (!tank) throw new AppError(404, 'Tank not found');

  const [reading] = await prisma.$transaction([
    prisma.fuelTankReading.create({ data: { storeId, userId, ...data } }),
    prisma.fuelTank.update({
      where: { id: data.tankId },
      data: { currentVolume: data.gaugeReading },
    }),
  ]);

  return reading;
}

export async function listReadings(storeId: string, tankId?: string) {
  return prisma.fuelTankReading.findMany({
    where: { storeId, ...(tankId && { tankId }) },
    include: { tank: true },
    orderBy: { readingDate: 'desc' },
    take: 100,
  });
}
