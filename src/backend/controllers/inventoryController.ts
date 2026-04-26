import { Request, Response, NextFunction } from 'express';
import * as inv from '../services/inventoryService';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { lowStock, page, limit } = req.query as Record<string, string>;
    const result = await inv.listInventory(req.user!.storeId, {
      lowStock: lowStock === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const tx = await inv.createTransaction(req.user!.storeId, req.body, req.user!.userId);
    res.status(201).json(tx);
  } catch (err) { next(err); }
}

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemId, type, page, limit } = req.query as Record<string, string>;
    const result = await inv.listTransactions(req.user!.storeId, {
      itemId, type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}
