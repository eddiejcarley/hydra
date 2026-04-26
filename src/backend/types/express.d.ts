import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        storeId: string;
        role: Role;
      };
    }
  }
}
