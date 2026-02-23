import express from 'express';
import {
    getAllCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    updateProgress,
    getMyEnrollments
} from '../controllers/courseController';
import { protect, restrictTo } from '../middlewares/auth';

const router = express.Router();

// Public routes (or basic auth)
router.use(protect);

router.get('/my-enrollments', getMyEnrollments);

router
    .route('/')
    .get(getAllCourses)
    .post(restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER'), createCourse);

router
    .route('/:id')
    .get(getCourse)
    .patch(restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER', 'MANAGEMENT'), updateCourse)
    .delete(restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER', 'MANAGEMENT'), deleteCourse);

router.post('/:id/enroll', enrollInCourse);
router.patch('/:id/progress', updateProgress);

export default router;
