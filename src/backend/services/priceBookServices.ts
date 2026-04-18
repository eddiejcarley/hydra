// src/services/priceBookService.ts
import { PrismaClient, Item } from '@prisma/client';
import { EventEmitter } from 'events';

export class PriceBookService {
  constructor(private prisma: PrismaClient, private eventBus: EventEmitter) {}

  async updateItem(
    itemId: string,
    data: Partial<Item>,
    userId: string
  ): Promise<Item> {
    const oldItem = await this.prisma.item.findUniqueOrThrow({
      where: { id: itemId },
    });

    // Track changes for auditable fields
    const auditFields = ['cost', 'retailPrice', 'departmentId'] as const;
    const priceHistoryEntries = [];
    for (const field of auditFields) {
      if (data[field] !== undefined && data[field] !== oldItem[field]) {
        priceHistoryEntries.push({
          itemId,
          field,
          oldValue: String(oldItem[field]),
          newValue: String(data[field]),
          changedBy: userId,
        });
      }
    }

    const updatedItem = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.update({
        where: { id: itemId },
        data,
      });
      if (priceHistoryEntries.length > 0) {
        await tx.priceHistory.createMany({ data: priceHistoryEntries });
      }
      return item;
    });

    this.eventBus.emit('item.updated', updatedItem);
    return updatedItem;
  }

  async bulkUpdatePrices(
    itemIds: string[],
    newPrice: number,
    userId: string
  ): Promise<void> {
    // Similar transaction with audit
  }

  // Bulk edit for department
  async bulkUpdateDepartment(
    itemIds: string[],
    departmentId: string,
    userId: string
  ): Promise<void> { ... }

  // Export for POS
  async exportPriceBook(storeId: string): Promise<any[]> {
    const items = await this.prisma.item.findMany({
      where: { storeId, status: 'ACTIVE' },
      include: { department: true },
    });
    // Transform to canonical export format
    return items.map(item => ({
      barcode: item.barcode,
      description: item.description,
      department: item.department.name,
      price: item.retailPrice,
      cost: item.cost, // optional, might not be exposed
      taxable: item.taxable,
      foodStamp: item.foodStampEligible,
    }));
  }
}