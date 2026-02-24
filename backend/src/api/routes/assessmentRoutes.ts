/**
 * Assessment Routes
 * Handles evaluation workflows for professional standards
 */
import express from 'express';
import { protect as authenticate, restrictTo as authorize } from '../middlewares/auth';
import {
    getAssessments, // Leader/Admin fetching templates
    createAssessment, // Leader/Admin creating templates
    updateAssessment, // Leader/Admin updating templates
    assignAssessment, // Leader/Admin assigning to group
    getMyAssignedAssessments, // Teacher fetching their assignments
    startAttempt, // Teacher starting an attempt
    saveAttemptProgress, // Teacher saving progress (untimed/timed)
    submitAttempt, // Teacher submitting
    getAnalytics, // Leader/Admin getting completion rates and scores
    deleteAssessment, // Leader/Admin deleting templates
} from '../controllers/assessmentController';

const router = express.Router();

// Teacher accessible routes
router.get('/my-assignments', authenticate, authorize('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), getMyAssignedAssessments);
router.post('/:assessmentId/attempt/start', authenticate, authorize('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), startAttempt);
router.put('/attempt/:attemptId/save', authenticate, authorize('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), saveAttemptProgress);
router.post('/attempt/:attemptId/submit', authenticate, authorize('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), submitAttempt);

// Leader/Admin accessible routes
router.get('/', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), getAssessments);
router.post('/', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), createAssessment);
router.put('/:assessmentId', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), updateAssessment);
router.post('/:assessmentId/assign', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), assignAssessment);
router.delete('/:assessmentId', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), deleteAssessment);
router.get('/analytics', authenticate, authorize('LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN'), getAnalytics);

export default router;
