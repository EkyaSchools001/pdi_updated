import express from 'express';
import { protect as authenticate } from '../middlewares/auth';
import { getGrowthAnalytics, validateGrowthAccess } from '../controllers/growthController';

const router = express.Router();

router.get('/analytics', authenticate, getGrowthAnalytics);
router.get('/validate/:teacherId', authenticate, validateGrowthAccess);

export default router;
