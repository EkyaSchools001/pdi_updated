import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { createPEObs, getAllPEObs, getPEObsById } from '../controllers/peObsController';

const router = Router();
router.use(protect);
router.get('/', getAllPEObs);
router.post('/', createPEObs);
router.get('/:id', getPEObsById);

export default router;
