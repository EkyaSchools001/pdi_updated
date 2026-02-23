import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public routes - anyone can read settings (needed for access matrix)
router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);

// Protected routes - only ADMIN/SUPERADMIN can modify
router.post('/upsert', protect, restrictTo('ADMIN', 'SUPERADMIN'), settingsController.upsertSetting);
router.delete('/:key', protect, restrictTo('ADMIN', 'SUPERADMIN'), settingsController.deleteSetting);

export default router;
