import { Router } from 'express';
import { submitMoocEvidence, getAllMoocSubmissions, updateMoocStatus } from '../controllers/moocController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.post('/submit', submitMoocEvidence);
router.get('/', getAllMoocSubmissions);
router.get('/user', getAllMoocSubmissions); // Alias used by TeacherDashboard
router.patch('/:id/status', restrictTo('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'), updateMoocStatus);

export default router;
