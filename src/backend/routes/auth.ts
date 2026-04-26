import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/authController';

const router = Router();

router.post('/setup', ctrl.setup);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);

export default router;
