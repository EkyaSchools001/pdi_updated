import { Router } from 'express';
import observationRoutes from './observationRoutes';
import authRoutes from './authRoutes';
import goalRoutes from './goalRoutes';
import userRoutes from './userRoutes';

import uploadRoutes from './uploadRoutes';
import documentRoutes from './documentRoutes';
import moocRoutes from './moocRoutes';
import trainingRoutes from './trainingRoutes';
import statsRoutes from './statsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/goals', goalRoutes);
router.use('/observations', observationRoutes);
router.use('/documents', documentRoutes);
router.use('/upload', uploadRoutes);
router.use('/mooc', moocRoutes);
router.use('/training', trainingRoutes);
router.use('/stats', statsRoutes);

export default router;
