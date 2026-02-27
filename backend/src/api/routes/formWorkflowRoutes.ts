import express from 'express';
import {
    getAllWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
} from '../controllers/formWorkflowController';
import { protect, restrictTo } from '../middlewares/auth';

const router = express.Router();

router.route('/')
    .get(protect, getAllWorkflows)
    .post(protect, restrictTo('SUPERADMIN', 'ADMIN'), createWorkflow);

router.route('/:id')
    .put(protect, restrictTo('SUPERADMIN', 'ADMIN'), updateWorkflow)
    .delete(protect, restrictTo('SUPERADMIN', 'ADMIN'), deleteWorkflow);

export default router;
