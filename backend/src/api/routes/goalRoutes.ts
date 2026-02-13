import { Router } from 'express';
import { getAllGoals, createGoal } from '../controllers/goalController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllGoals);
router.post('/', createGoal);

export default router;
