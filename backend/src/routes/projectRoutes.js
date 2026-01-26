import express from 'express';
import multer from 'multer';
import { initProject, uploadCode } from '../controllers/projectController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure Multer (Memory Storage - we process file in RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Client creates project
router.post('/create', authenticateToken, requireRole('CLIENT'), initProject);

// Developer uploads code
// Note: 'sourceCode' matches the key name in the form-data
router.post('/upload', authenticateToken, requireRole('DEVELOPER'), upload.single('sourceCode'), uploadCode);

export default router;