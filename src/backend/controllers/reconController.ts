import { Request, Response, NextFunction } from 'express';
import * as recon from '../services/reconService';

export async function listCloses(req: Request, res: Response, next: NextFunction) {
  try { res.json(await recon.listDailyCloses(req.user!.storeId)); }
  catch (err) { next(err); }
}

export async function createClose(req: Request, res: Response, next: NextFunction) {
  try {
    const close = await recon.createDailyClose(req.user!.storeId, req.body);
    res.status(201).json(close);
  } catch (err) { next(err); }
}

export async function updateClose(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await recon.updateDailyClose(req.params.id, req.user!.userId, req.body));
  } catch (err) { next(err); }
}

export async function listSpotCounts(req: Request, res: Response, next: NextFunction) {
  try { res.json(await recon.listSpotCounts(req.user!.storeId)); }
  catch (err) { next(err); }
}

export async function createSpotCount(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await recon.createSpotCount(req.user!.storeId, req.user!.userId, req.body);
    res.status(201).json(session);
  } catch (err) { next(err); }
}

export async function completeSpotCount(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await recon.completeSpotCount(req.params.id));
  } catch (err) { next(err); }
}
