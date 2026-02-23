import { Router } from 'express';
import {
    getAllMeetings,
    getMeetingById,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    completeMeeting
} from '../controllers/meetingController';
import {
    createMoM,
    updateMoM,
    publishMoM,
    addReply,
    shareMoM,
    getMoM
} from '../controllers/momController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect); // All meeting routes require authentication

// Meeting CRUD
router.get('/', getAllMeetings);
router.get('/:id', getMeetingById);
router.post('/', restrictTo('ADMIN', 'LEADER', 'COORDINATOR', 'HOS', 'SUPERADMIN'), createMeeting);
router.patch('/:id', updateMeeting);
router.patch('/:id/complete', completeMeeting);
router.delete('/:id', deleteMeeting);

// MoM Routes
router.post('/:meetingId/mom', createMoM);
router.patch('/:meetingId/mom', updateMoM);
router.post('/:meetingId/mom/publish', publishMoM);
router.post('/:meetingId/mom/reply', addReply);
router.post('/:meetingId/mom/share', shareMoM);
router.get('/:meetingId/mom', getMoM);

export default router;
