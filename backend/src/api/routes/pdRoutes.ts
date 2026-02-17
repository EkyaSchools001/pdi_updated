import { Router } from 'express';
import { getPdHistory, createPdEntry } from '../controllers/pdController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getPdHistory);
router.post('/', createPdEntry);

export default router;
