import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
    createObservation,
    getAllObservations,
    getObservationById,
} from '../controllers/performingArtsObsController';

const router = Router();

router.use(protect);

router.get('/', getAllObservations);
router.get('/:id', getObservationById);
router.post('/', createObservation);

export default router;
