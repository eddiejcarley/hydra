import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/itemsController';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/export', ctrl.exportBook);
router.post('/bulk-prices', ctrl.bulkPrices);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.deactivate);
router.get('/:id/history', ctrl.history);

router.get('/departments', ctrl.listDepts);
router.post('/departments', ctrl.createDept);
router.get('/vendors', ctrl.listVendors);
router.post('/vendors', ctrl.createVendor);

export default router;
