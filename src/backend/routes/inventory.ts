import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/inventoryController';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/transactions', ctrl.listTransactions);
router.post('/transactions', ctrl.createTransaction);

export default router;
