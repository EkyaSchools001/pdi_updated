import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require authentication
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
