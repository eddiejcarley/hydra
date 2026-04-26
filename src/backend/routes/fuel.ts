import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/fuelController';

const router = Router();
router.use(authenticate);

router.get('/tanks', ctrl.listTanks);
router.post('/tanks', ctrl.createTank);
router.put('/tanks/:id', ctrl.updateTank);

router.get('/deliveries', ctrl.listDeliveries);
router.post('/deliveries', ctrl.logDelivery);

router.get('/readings', ctrl.listReadings);
router.post('/readings', ctrl.logReading);

export default router;
