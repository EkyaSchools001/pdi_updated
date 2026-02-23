import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Settings routes - All authenticated users can read for access control
// IMPORTANT: /upsert must be before /:key to avoid "upsert" being matched as a key
router.route('/upsert')
    .post(restrictTo('ADMIN', 'SUPERADMIN'), settingsController.upsertSetting);

router.route('/')
    .get(settingsController.getAllSettings);

router.route('/:key')
    .get(settingsController.getSetting)
    .delete(restrictTo('ADMIN', 'SUPERADMIN'), settingsController.deleteSetting);

export default router;
