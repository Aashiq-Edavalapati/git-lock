import express from 'express';
import { register, login, verifyMFA, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-mfa', verifyMFA);
router.get('/me', authenticateToken, getMe);

export default router;