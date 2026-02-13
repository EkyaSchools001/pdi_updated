import { Router } from 'express';
import { login, refresh } from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Incorrect email or password }
 */
router.post('/login', login);
router.post('/refresh', refresh);

export default router;
