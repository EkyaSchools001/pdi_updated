import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { protect as authenticate } from '../middlewares/auth';

const router = Router();

router.post('/generate-questions', authenticate, aiController.generateQuestions);

export default router;
