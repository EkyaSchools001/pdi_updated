import { Router } from 'express';
import * as surveyController from '../controllers/surveyController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes
router.use(protect);

// Get active survey (Teachers/Leaders submit; Admin/Mgmt view)
router.get('/active', surveyController.getActiveSurvey);

// Get user's survey history
router.get('/my-history', surveyController.getMySurveyHistory);

// Submit survey (Teachers/Leaders)
router.post('/submit', restrictTo('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'MANAGEMENT'), surveyController.submitSurvey);

// Analytics (Admin/Mgmt only)
router.get('/:surveyId/analytics', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.getSurveyAnalytics);
router.get('/:surveyId/export', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.exportSurveyResults);

// Get specific survey (Admin/Mgmt/Teacher view own)
router.get('/:id', surveyController.getSurveyById);

// Management Routes
router.patch('/:id', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.updateSurvey);

router.post('/:surveyId/questions', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.createQuestion);
router.patch('/questions/:id', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.updateQuestion);
router.delete('/questions/:id', restrictTo('ADMIN', 'MANAGEMENT', 'SUPERADMIN'), surveyController.deleteQuestion);

export default router;
