import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect); // All notification routes require authentication

router.get('/', notificationController.getNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
