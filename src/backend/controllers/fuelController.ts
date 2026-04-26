import { Request, Response, NextFunction } from 'express';
import * as fuel from '../services/fuelService';

export async function listTanks(req: Request, res: Response, next: NextFunction) {
  try { res.json(await fuel.listTanks(req.user!.storeId)); }
  catch (err) { next(err); }
}

export async function createTank(req: Request, res: Response, next: NextFunction) {
  try {
    const tank = await fuel.createTank(req.user!.storeId, req.body);
    res.status(201).json(tank);
  } catch (err) { next(err); }
}

export async function updateTank(req: Request, res: Response, next: NextFunction) {
  try { res.json(await fuel.updateTank(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function logDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const delivery = await fuel.logDelivery(req.user!.storeId, req.user!.userId, req.body);
    res.status(201).json(delivery);
  } catch (err) { next(err); }
}

export async function listDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const { tankId } = req.query as Record<string, string>;
    res.json(await fuel.listDeliveries(req.user!.storeId, tankId));
  } catch (err) { next(err); }
}

export async function logReading(req: Request, res: Response, next: NextFunction) {
  try {
    const reading = await fuel.logReading(req.user!.storeId, req.user!.userId, req.body);
    res.status(201).json(reading);
  } catch (err) { next(err); }
}

export async function listReadings(req: Request, res: Response, next: NextFunction) {
  try {
    const { tankId } = req.query as Record<string, string>;
    res.json(await fuel.listReadings(req.user!.storeId, tankId));
  } catch (err) { next(err); }
}
