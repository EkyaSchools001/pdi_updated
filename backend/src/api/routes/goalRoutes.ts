import { Router } from 'express';
import { getAllGoals, createGoal, updateGoal, notifyWindowOpen } from '../controllers/goalController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllGoals);
router.post('/', createGoal);
router.post('/notify-window-open', notifyWindowOpen);
router.patch('/:id', updateGoal);

export default router;
