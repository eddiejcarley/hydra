// POS integration service — stub until Monday when POS company access is available.
// Replace the body of importFile() with the real adapter once credentials are in hand.

import prisma from '../utils/prisma';

export const STUB_MESSAGE =
  'POS integration is not yet configured. Come back Monday once POS company access is set up.';

export async function listBatches(storeId: string) {
  return prisma.posImportBatch.findMany({
    where: { storeId },
    orderBy: { processedAt: 'desc' },
    take: 50,
  });
}

export async function importFile(_storeId: string, _fileName: string): Promise<never> {
  throw { statusCode: 503, message: STUB_MESSAGE };
}
