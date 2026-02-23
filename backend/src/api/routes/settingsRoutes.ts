import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Allow public access to the access matrix configuration for frontend routing/permissions
router.get('/access_matrix_config', (req, res, next) => {
    (req.params as any).key = 'access_matrix_config';
    settingsController.getSetting(req, res, next);
});

// All other routes require authentication
router.use(protect);

// Settings routes - All authenticated users can read for access control
router.route('/')
    .get(settingsController.getAllSettings);

router.route('/:key')
    .get(settingsController.getSetting);

router.route('/upsert')
    .post(restrictTo('ADMIN', 'SUPERADMIN'), settingsController.upsertSetting);

router.route('/:key')
    .delete(restrictTo('ADMIN', 'SUPERADMIN'), settingsController.deleteSetting);

export default router;
