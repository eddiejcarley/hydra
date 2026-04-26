import { Request, Response, NextFunction } from 'express';
import * as pos from '../services/posService';

export async function listBatches(req: Request, res: Response, next: NextFunction) {
  try { res.json(await pos.listBatches(req.user!.storeId)); }
  catch (err) { next(err); }
}

export async function importFile(req: Request, res: Response, next: NextFunction) {
  try {
    await pos.importFile(req.user!.storeId, req.body.fileName ?? '');
    res.json({});
  } catch (err: any) {
    if (err?.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
}
