import { Router } from 'express';
import { register, login, refreshTokens, logout, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokens);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;