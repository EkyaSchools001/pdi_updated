import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { createVAObs, getAllVAObs, getVAObsById } from '../controllers/vaObsController';

const router = Router();
router.use(protect);
router.get('/', getAllVAObs);
router.post('/', createVAObs);
router.get('/:id', getVAObsById);

export default router;
