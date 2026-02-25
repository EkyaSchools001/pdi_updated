import { Router } from 'express';
import { getGrowthAnalytics, validateGrowthAccess } from '../controllers/growthController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/analytics', restrictTo('ADMIN', 'SUPERADMIN'), getGrowthAnalytics);
router.get('/validate-access', validateGrowthAccess);
router.get('/validate-access/:teacherId', validateGrowthAccess);

export default router;
