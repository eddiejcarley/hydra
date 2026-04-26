import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const promos = await prisma.promotion.findMany({
      where: { storeId: req.user!.storeId },
      include: { items: { include: { item: true } } },
      orderBy: { startDate: 'desc' },
    });
    res.json(promos);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { items: itemLinks, ...promoData } = req.body;
    const promo = await prisma.promotion.create({
      data: {
        ...promoData,
        storeId: req.user!.storeId,
        startDate: new Date(promoData.startDate),
        endDate: new Date(promoData.endDate),
        items: itemLinks?.length
          ? { create: itemLinks.map((l: { itemId: string; quantity?: number }) => ({ itemId: l.itemId, quantity: l.quantity })) }
          : undefined,
      },
      include: { items: { include: { item: true } } },
    });
    res.status(201).json(promo);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const promo = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promo) throw new AppError(404, 'Promotion not found');

    const { items: itemLinks, ...data } = req.body;
    const updated = await prisma.$transaction(async (tx) => {
      if (itemLinks) {
        await tx.promotionItem.deleteMany({ where: { promotionId: req.params.id } });
        if (itemLinks.length) {
          await tx.promotionItem.createMany({
            data: itemLinks.map((l: { itemId: string; quantity?: number }) => ({
              promotionId: req.params.id, itemId: l.itemId, quantity: l.quantity,
            })),
          });
        }
      }
      return tx.promotion.update({
        where: { id: req.params.id },
        data: {
          ...data,
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
        },
        include: { items: { include: { item: true } } },
      });
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const promo = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promo) throw new AppError(404, 'Promotion not found');
    await prisma.$transaction([
      prisma.promotionItem.deleteMany({ where: { promotionId: req.params.id } }),
      prisma.promotion.delete({ where: { id: req.params.id } }),
    ]);
    res.status(204).end();
  } catch (err) { next(err); }
}
