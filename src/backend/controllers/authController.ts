import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err) { next(err); }
}

export async function setup(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeName, username, password } = req.body;
    if (!storeName || !username || !password) return res.status(400).json({ error: 'storeName, username and password required' });
    const result = await authService.createInitialOwner(storeName, username, password);
    res.status(201).json(result);
  } catch (err) { next(err); }
}
