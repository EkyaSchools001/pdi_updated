import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// ─── Read routes ─────────────────────────────────────────────────────────────
// All authenticated users can READ settings (needed for access matrix sync).
// The route-level auth is handled by `protect` in the main router,
// but the access_matrix_config path is bypassed in roleModuleAuth middleware
// so even teachers can fetch the permission matrix.
router.get('/', protect, settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);

// ─── Write routes ────────────────────────────────────────────────────────────
// ONLY SuperAdmin can create/update/delete settings.
// This is the single point of access control for the Global Access Matrix.
router.post('/upsert', protect, restrictTo('SUPERADMIN'), settingsController.upsertSetting);
router.delete('/:key', protect, restrictTo('SUPERADMIN'), settingsController.deleteSetting);

export default router;
