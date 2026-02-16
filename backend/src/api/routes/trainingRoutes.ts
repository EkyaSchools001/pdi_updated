import { Router } from 'express';
import { getAllTrainingEvents, createTrainingEvent, registerForEvent, updateEventStatus, deleteTrainingEvent, updateTrainingEvent } from '../controllers/trainingController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllTrainingEvents);
router.post('/', restrictTo('SCHOOL_LEADER', 'LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), createTrainingEvent);
router.post('/:eventId/register', registerForEvent);
router.patch('/:id/status', restrictTo('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), updateEventStatus);
router.put('/:id', restrictTo('ADMIN', 'SUPERADMIN'), updateTrainingEvent);
router.delete('/:id', restrictTo('ADMIN', 'SUPERADMIN'), deleteTrainingEvent);

export default router;
