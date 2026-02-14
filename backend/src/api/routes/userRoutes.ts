import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);
// Allow Leaders and Management to view users (for dashboard stats etc)
router.use(restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'MANAGEMENT'));


router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
