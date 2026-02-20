import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);
// Allow everyone (Authenticated) to view users for directory/search
router.get('/', getAllUsers);

// Restrict modification routes
router.use(restrictTo('ADMIN', 'SUPERADMIN', 'LEADER', 'MANAGEMENT'));

router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
