import express from 'express';
import { createOrder, verifyAndUnlock } from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Initiate Payment (Client Only)
router.post('/create-order', authenticateToken, requireRole('CLIENT'), createOrder);

// 2. Verify Signature & Download File (Client Only + MFA Check)
// TODO: Check if MFA was recently verified. 
router.post('/unlock', authenticateToken, requireRole('CLIENT'), verifyAndUnlock);

export default router;