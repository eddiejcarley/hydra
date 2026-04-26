import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/posController';

const router = Router();
router.use(authenticate);

router.get('/batches', ctrl.listBatches);
router.post('/import', ctrl.importFile);

export default router;
