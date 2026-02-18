import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes
router.use(protect);

// Global Admin View
router.get('/admin/all', restrictTo('ADMIN', 'SUPERADMIN', 'LEADER'), attendanceController.getAllAttendance);

// Event specific routes
router.post('/:id/toggle', attendanceController.toggleAttendance); // Enable/Close
router.post('/:id/submit', attendanceController.submitAttendance); // Mark Attendance
router.get('/:id', attendanceController.getEventAttendance); // View List

export default router;
