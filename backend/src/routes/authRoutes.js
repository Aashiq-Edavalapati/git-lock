import express from 'express';
import { register, login, verifyMFA, getMe, githubLogin, googleLogin, logout, connectGithubAccount } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login', login);
router.post('/github', githubLogin);
router.post('/github/connect', authenticateToken, connectGithubAccount);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.post('/verify-mfa', verifyMFA);
router.get('/me', authenticateToken, getMe);

export default router;