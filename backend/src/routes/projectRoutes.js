import express from 'express';
import multer from 'multer';
import { acceptProject, initProject, inviteDeveloper, uploadCode, listProjects, getProject } from '../controllers/projectController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure Multer (Memory Storage - we process file in RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// List my projects
router.get('/', authenticateToken, listProjects);
router.get('/:id', authenticateToken, getProject);

// Client creates project
router.post('/create', authenticateToken, requireRole('CLIENT'), initProject);

// Client invites developer later
router.post('/invite', authenticateToken, requireRole('CLIENT'), inviteDeveloper);

// Developer accepts invite
router.post('/accept', authenticateToken, requireRole('DEVELOPER'), acceptProject);

// Developer uploads code
router.post('/upload', authenticateToken, requireRole('DEVELOPER'), upload.single('sourceCode'), uploadCode);

export default router;