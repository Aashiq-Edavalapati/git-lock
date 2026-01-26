import express from 'express';
import { register, login, verifyMFA } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-mfa', verifyMFA);

export default router;