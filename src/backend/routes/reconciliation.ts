import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/reconController';

const router = Router();
router.use(authenticate);

router.get('/daily', ctrl.listCloses);
router.post('/daily', ctrl.createClose);
router.put('/daily/:id', ctrl.updateClose);

router.get('/spot-counts', ctrl.listSpotCounts);
router.post('/spot-counts', ctrl.createSpotCount);
router.put('/spot-counts/:id/complete', ctrl.completeSpotCount);

export default router;
