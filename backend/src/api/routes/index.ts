import { Router } from 'express';
import observationRoutes from './observationRoutes';
import authRoutes from './authRoutes';
import goalRoutes from './goalRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/observations', observationRoutes);
router.use('/goals', goalRoutes);
router.use('/users', userRoutes);

export default router;
