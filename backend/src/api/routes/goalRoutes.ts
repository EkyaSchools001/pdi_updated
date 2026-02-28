import { Router } from 'express';
import {
    getAllGoals,
    createGoal,
    updateGoal,
    notifyWindowOpen,
    submitSelfReflection,
    submitGoalSetting,
    submitGoalCompletion,
    getGoalAnalyticsDashboard
} from '../controllers/goalController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAllGoals);
router.get('/analytics', getGoalAnalyticsDashboard);
router.post('/', createGoal);
router.post('/notify-window-open', notifyWindowOpen);

router.post('/:id/self-reflection', restrictTo('TEACHER'), submitSelfReflection);
router.post('/:id/goal-setting', restrictTo('SUPERADMIN', 'ADMIN', 'LEADER'), submitGoalSetting);
router.post('/:id/goal-completion', restrictTo('SUPERADMIN', 'ADMIN', 'LEADER'), submitGoalCompletion);

router.patch('/:id', updateGoal);

export default router;
