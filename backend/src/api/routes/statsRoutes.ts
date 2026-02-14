import { Router } from 'express';
import { getAdminStats } from '../controllers/statsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.get('/admin', protect, restrictTo('ADMIN', 'SUPERADMIN'), getAdminStats);

export default router;
