import { Request, Response, NextFunction } from 'express';
import * as pb from '../services/priceBookServices';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, departmentId, status, page, limit } = req.query as Record<string, string>;
    const result = await pb.listItems(req.user!.storeId, {
      search, departmentId, status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pb.getItem(req.params.id));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await pb.createItem(req.user!.storeId, req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await pb.updateItem(req.params.id, req.body, req.user!.userId);
    res.json(item);
  } catch (err) { next(err); }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await pb.deactivateItem(req.params.id, req.user!.userId);
    res.json(item);
  } catch (err) { next(err); }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pb.getItemHistory(req.params.id));
  } catch (err) { next(err); }
}

export async function exportBook(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pb.exportPriceBook(req.user!.storeId));
  } catch (err) { next(err); }
}

export async function bulkPrices(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemIds, retailPrice } = req.body;
    await pb.bulkUpdatePrices(itemIds, retailPrice, req.user!.userId);
    res.json({ updated: itemIds.length });
  } catch (err) { next(err); }
}

// Departments
export async function listDepts(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pb.listDepartments(req.user!.storeId));
  } catch (err) { next(err); }
}

export async function createDept(req: Request, res: Response, next: NextFunction) {
  try {
    const dept = await pb.createDepartment(req.user!.storeId, req.body.name);
    res.status(201).json(dept);
  } catch (err) { next(err); }
}

// Vendors
export async function listVendors(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pb.listVendors(req.user!.storeId));
  } catch (err) { next(err); }
}

export async function createVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await pb.createVendor(req.user!.storeId, req.body);
    res.status(201).json(vendor);
  } catch (err) { next(err); }
}
