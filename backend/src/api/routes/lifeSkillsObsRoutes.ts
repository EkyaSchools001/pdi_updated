import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
    createLifeSkillsObs,
    getAllLifeSkillsObs,
    getLifeSkillsObsById,
} from '../controllers/lifeSkillsObsController';

const router = Router();

router.use(protect);

router.get('/', getAllLifeSkillsObs);
router.post('/', createLifeSkillsObs);
router.get('/:id', getLifeSkillsObsById);

export default router;
