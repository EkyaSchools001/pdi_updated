import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = express.Router();

// Most analytics routes require ADMIN/SUPERADMIN/MANAGEMENT roles
router.use(protect);

const adminOnly = restrictTo('ADMIN', 'SUPERADMIN', 'MANAGEMENT');

router.get('/avg-hours-school', adminOnly, analyticsController.getAvgHoursPerSchool);
router.get('/teacher-hours/:campusId', adminOnly, analyticsController.getTeacherHoursDetails);
router.get('/cutoff-stats', adminOnly, analyticsController.getCutoffStats);
router.get('/attendance', adminOnly, analyticsController.getAttendanceAnalytics);
router.get('/attendance/campuses', adminOnly, analyticsController.getCampusAttendanceAnalytics);
router.get('/attendance/:eventId', adminOnly, analyticsController.getEventAttendees);
router.get('/feedback', adminOnly, analyticsController.getFeedbackAnalytics);

// Campus engagement explicitly handles its own role scoping internally
router.get('/engagement', analyticsController.getCampusEngagement);

export default router;
