import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { getAdminStats } from '../controllers/auditController.js';

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireRole('ADMIN'), getAdminStats);

export default router;
