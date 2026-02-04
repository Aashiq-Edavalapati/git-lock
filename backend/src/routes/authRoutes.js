import express from 'express';
import { register, login, verifyMFA, getMe, githubLogin, googleLogin, logout, connectGithubAccount, updateProfile, deleteAccount, initiateDeleteAccount, requestOTP, forgotPassword, resetPassword, initiateChangePassword, finalizeChangePassword, resendLoginOTP } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/github', githubLogin);
router.post('/github/connect', authenticateToken, connectGithubAccount);
router.post('/google', googleLogin);
router.post('/logout', logout);

// Profile
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

// MFA & Sensitive Actions
router.post('/request-otp', authenticateToken, requestOTP);
router.post('/delete-account/initiate', authenticateToken, initiateDeleteAccount);
router.delete('/delete-account', authenticateToken, deleteAccount);
router.post('/verify-mfa', verifyMFA);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password/initiate', authenticateToken, initiateChangePassword);
router.post('/change-password/finalize', authenticateToken, finalizeChangePassword);

export default router;