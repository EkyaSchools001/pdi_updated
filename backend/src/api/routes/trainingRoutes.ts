import { Router } from 'express';
import { getAllTrainingEvents, getTrainingEvent, createTrainingEvent, registerForEvent, updateEventStatus, deleteTrainingEvent, updateTrainingEvent } from '../controllers/trainingController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllTrainingEvents);
router.get('/:id', getTrainingEvent);
router.post('/', restrictTo('SCHOOL_LEADER', 'LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), createTrainingEvent);
router.post('/:eventId/register', registerForEvent);
router.patch('/:id/status', restrictTo('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), updateEventStatus);
router.put('/:id', restrictTo('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), updateTrainingEvent);
router.delete('/:id', restrictTo('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), deleteTrainingEvent);

export default router;
