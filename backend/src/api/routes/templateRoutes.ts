import { Router } from 'express';
import * as templateController from '../controllers/templateController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Template routes
router.route('/')
    .get(templateController.getAllTemplates)
    .post(restrictTo('ADMIN', 'SUPERADMIN'), templateController.createTemplate);

router.route('/:id')
    .get(templateController.getTemplate)
    .put(restrictTo('ADMIN', 'SUPERADMIN'), templateController.updateTemplate)
    .delete(restrictTo('ADMIN', 'SUPERADMIN'), templateController.deleteTemplate);

export default router;
