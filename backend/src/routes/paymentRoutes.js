import express from 'express';
import { createOrder, verifyAndUnlock, getRazorpayKey } from '../controllers/paymentController.js';
import { authenticateToken, requireRole, checkAcl } from '../middleware/authMiddleware.js';
import { getPaymentLogs } from '../controllers/auditController.js';

const router = express.Router();

// 1. Initiate Payment (Client Only)
router.post('/create-order', authenticateToken, requireRole('CLIENT'), createOrder);

// 1.5 Get Key
router.get('/key', authenticateToken, getRazorpayKey);

// 2. Verify Signature & Download File (Client Only + MFA Check)
// TODO: Check if MFA was recently verified. 
router.post('/unlock', authenticateToken, requireRole('CLIENT'), verifyAndUnlock);

/*
 * ACL: PAYMENT LOGS
 * Global History for User (Client/Dev/Admin)
 */
router.get('/history', authenticateToken, checkAcl('PAYMENT_LOGS', 'READ'), getPaymentLogs);

export default router;