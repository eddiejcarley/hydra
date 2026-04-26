import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/itemsController';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listDepts);
router.post('/', ctrl.createDept);

export default router;
