import { Router } from 'express';
import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    acknowledgeAnnouncement,
    getAnnouncementStats
} from '../controllers/announcementController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/acknowledge/:id', acknowledgeAnnouncement);

// Creator/Admin routes
router.post('/', restrictTo('ADMIN', 'LEADER', 'SCHOOL_LEADER', 'COORDINATOR', 'HOS', 'SUPERADMIN', 'MANAGEMENT'), createAnnouncement);
router.patch('/:id', restrictTo('ADMIN', 'LEADER', 'SCHOOL_LEADER', 'COORDINATOR', 'HOS', 'SUPERADMIN', 'MANAGEMENT'), updateAnnouncement);
router.delete('/:id', restrictTo('ADMIN', 'LEADER', 'SCHOOL_LEADER', 'COORDINATOR', 'HOS', 'SUPERADMIN', 'MANAGEMENT'), deleteAnnouncement);
router.get('/:id/stats', restrictTo('ADMIN', 'LEADER', 'SCHOOL_LEADER', 'COORDINATOR', 'HOS', 'SUPERADMIN', 'MANAGEMENT'), getAnnouncementStats);

export default router;
