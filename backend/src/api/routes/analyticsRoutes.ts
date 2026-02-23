import { Router } from 'express';
import { getCampusEngagement } from '../controllers/analyticsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Only allow leadership and above
router.get(
    '/campus-engagement',
    protect,
    restrictTo('HOS', 'ACADEMIC_COORDINATOR', 'CCA_COORDINATOR', 'LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT'),
    getCampusEngagement
);

export default router;
