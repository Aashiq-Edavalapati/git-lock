import express from 'express';
import { register, login, verifyMFA, getMe, githubLogin, googleLogin, logout, connectGithubAccount, updateProfile, deleteAccount, initiateDeleteAccount, requestOTP } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login', login);
router.post('/github', githubLogin);
router.post('/github/connect', authenticateToken, connectGithubAccount);
router.post('/login/google', googleLogin);
router.post('/logout', logout);

// Profile
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

// MFA & Sensitive Actions
router.post('/request-otp', authenticateToken, requestOTP);
router.post('/delete-account/initiate', authenticateToken, initiateDeleteAccount);
router.get('/me', authenticateToken, getMe);

export default router;