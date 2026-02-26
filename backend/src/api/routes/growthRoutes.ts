import { Router } from 'express';
import { getGrowthAnalytics, validateGrowthAccess } from '../controllers/growthController';
import * as growthObservationController from '../controllers/growthObservationController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/analytics', restrictTo('ADMIN', 'SUPERADMIN'), getGrowthAnalytics);
router.get('/validate-access', validateGrowthAccess);
router.get('/validate-access/:teacherId', validateGrowthAccess);

// Unified Growth Observations
router.post('/observations', restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER'), growthObservationController.createGrowthObservation);
router.get('/observations', growthObservationController.getGrowthObservations);
router.get('/observations/:id', growthObservationController.getGrowthObservationById);
router.patch('/observations/:id', restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER'), growthObservationController.updateGrowthObservation);

export default router;
