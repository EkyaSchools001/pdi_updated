import { Router } from 'express';
import * as growthObservationController from '../controllers/growthObservationController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes are protected
router.use(protect);

router.post('/', restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER'), growthObservationController.createGrowthObservation);
router.get('/', growthObservationController.getGrowthObservations);
router.get('/:id', growthObservationController.getGrowthObservationById);
router.patch('/:id', restrictTo('TEACHER', 'ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER'), growthObservationController.updateGrowthObservation);

export default router;
