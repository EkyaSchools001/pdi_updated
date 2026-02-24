import express from 'express';
import { protect as authenticate, restrictTo as authorize } from '../middlewares/auth';
import { getOKRData } from '../controllers/okrController';

const router = express.Router();

router.get(
    '/',
    authenticate,
    authorize('TEACHER', 'LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN', 'MANAGEMENT'),
    getOKRData
);

export default router;
