import { Router } from 'express';
import { roleModuleAuth } from '../middlewares/accessControl';
import observationRoutes from './observationRoutes';
import authRoutes from './authRoutes';
import goalRoutes from './goalRoutes';
import userRoutes from './userRoutes';

import uploadRoutes from './uploadRoutes';
import documentRoutes from './documentRoutes';
import moocRoutes from './moocRoutes';
import trainingRoutes from './trainingRoutes';
import statsRoutes from './statsRoutes';
import courseRoutes from './courseRoutes';

import templateRoutes from './templateRoutes';
import settingsRoutes from './settingsRoutes';
import pdRoutes from './pdRoutes';
import attendanceRoutes from './attendanceRoutes';
import meetingRoutes from './meetingRoutes';
import notificationRoutes from './notificationRoutes';
import announcementRoutes from './announcementRoutes';
import surveyRoutes from './surveyRoutes';
import learningFestivalRoutes from './learningFestivalRoutes';
import analyticsRoutes from './analyticsRoutes';
import assessmentRoutes from './assessmentRoutes';
import growthRoutes from './growthRoutes';
import okrRoutes from './okrRoutes';
import aiRoutes from './aiRoutes';
const router = Router();

// Apply dynamic access matrix configuration globally
router.use(roleModuleAuth);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/growth', growthRoutes);
router.use('/goals', goalRoutes);
router.use('/observations', observationRoutes);
router.use('/documents', documentRoutes);
router.use('/upload', uploadRoutes);
router.use('/mooc', moocRoutes);
router.use('/training', trainingRoutes);
router.use('/stats', statsRoutes);
router.use('/courses', courseRoutes);
router.use('/templates', templateRoutes);
router.use('/settings', settingsRoutes);
router.use('/pd', pdRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/meetings', meetingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/announcements', announcementRoutes);
router.use('/surveys', surveyRoutes);
router.use('/festivals', learningFestivalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/okr', okrRoutes);
router.use('/ai', aiRoutes);

export default router;
