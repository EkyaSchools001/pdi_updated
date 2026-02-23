import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
    getFestivals,
    createFestival,
    updateFestival,
    applyToFestival,
    getApplications,
    updateApplicationStatus,
    getEngagementAnalytics
} from '../controllers/learningFestivalController';

const router = Router();

// Used by all authenticated users
router.get('/', protect, getFestivals);
router.get('/applications', protect, getApplications);
router.post('/:id/apply', protect, applyToFestival);
router.get('/analytics', protect, getEngagementAnalytics);

// Admin / Management endpoints (role checks can be added here or in middleware)
router.post('/', protect, createFestival);
router.put('/:id', protect, updateFestival);
router.put('/applications/:id/status', protect, updateApplicationStatus);

export default router;
