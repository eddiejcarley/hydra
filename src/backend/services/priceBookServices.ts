import { Item, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import eventBus from '../events/eventBus';
import { AppError } from '../middleware/errorHandler';

const AUDIT_FIELDS = ['cost', 'retailPrice', 'departmentId'] as const;

export async function listItems(storeId: string, opts: {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { search, departmentId, status = 'ACTIVE', page = 1, limit = 50 } = opts;
  const where: Prisma.ItemWhereInput = { storeId, status };
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { department: true, vendor: true, inventory: true },
      orderBy: { description: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.item.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: { department: true, vendor: true, inventory: true },
  });
  if (!item) throw new AppError(404, 'Item not found');
  return item;
}

export async function createItem(storeId: string, data: Prisma.ItemUncheckedCreateInput) {
  const item = await prisma.item.create({
    data: { ...data, storeId },
    include: { department: true, vendor: true },
  });
  eventBus.emit('item.created', item);
  return item;
}

export async function updateItem(itemId: string, data: Partial<Item>, userId: string) {
  const oldItem = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });

  const entries: Prisma.PriceHistoryCreateManyInput[] = [];
  for (const field of AUDIT_FIELDS) {
    if (data[field] !== undefined && String(data[field]) !== String(oldItem[field])) {
      entries.push({ itemId, field, oldValue: String(oldItem[field]), newValue: String(data[field]), changedBy: userId });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.item.update({ where: { id: itemId }, data, include: { department: true, vendor: true } });
    if (entries.length) await tx.priceHistory.createMany({ data: entries });
    return item;
  });

  eventBus.emit('item.updated', updated);
  return updated;
}

export async function deactivateItem(itemId: string, userId: string) {
  return updateItem(itemId, { status: 'INACTIVE' } as Partial<Item>, userId);
}

export async function getItemHistory(itemId: string) {
  return prisma.priceHistory.findMany({
    where: { itemId },
    orderBy: { changedAt: 'desc' },
  });
}

export async function bulkUpdatePrices(itemIds: string[], retailPrice: number, userId: string) {
  await Promise.all(itemIds.map((id) => updateItem(id, { retailPrice } as Partial<Item>, userId)));
}

export async function exportPriceBook(storeId: string) {
  const items = await prisma.item.findMany({
    where: { storeId, status: 'ACTIVE' },
    include: { department: true },
  });
  return items.map((item) => ({
    barcode: item.barcode,
    description: item.description,
    department: item.department.name,
    price: item.retailPrice,
    cost: item.cost,
    taxable: item.taxable,
    foodStamp: item.foodStampEligible,
  }));
}

// Departments
export async function listDepartments(storeId: string) {
  return prisma.department.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
}

export async function createDepartment(storeId: string, name: string) {
  return prisma.department.create({ data: { storeId, name } });
}

// Vendors
export async function listVendors(storeId: string) {
  return prisma.vendor.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
}

export async function createVendor(storeId: string, data: Omit<Prisma.VendorCreateInput, 'store'>) {
  return prisma.vendor.create({ data: { ...data, store: { connect: { id: storeId } } } });
}
