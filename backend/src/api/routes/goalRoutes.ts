import { Router } from 'express';
import { getAllGoals, createGoal, updateGoal } from '../controllers/goalController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllGoals);
router.post('/', createGoal);
router.patch('/:id', updateGoal);

export default router;
