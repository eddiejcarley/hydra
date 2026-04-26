import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const token = jwt.sign(
    { userId: user.id, storeId: user.storeId, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  );

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role, storeId: user.storeId },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, username: true, role: true, storeId: true, store: { select: { name: true } } },
  });
  return user;
}

export async function createInitialOwner(
  storeName: string,
  username: string,
  password: string
) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError(409, 'Username already taken');

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({ data: { name: storeName } });
    const user = await tx.user.create({
      data: { storeId: store.id, username, passwordHash, role: 'OWNER' },
      select: { id: true, username: true, role: true, storeId: true },
    });
    return { store, user };
  });
}
