import express from 'express';
import multer from 'multer';
import { acceptProject, initProject, inviteDeveloper, uploadCode, listProjects, getProject, verifyProjectDetails, downloadCode, requestLockModification, approveLockModification, getProjectLockRequests, removeDeveloper } from '../controllers/projectController.js';
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
router.post('/cancel-invite', authenticateToken, requireRole('CLIENT'), removeDeveloper);

// Developer accepts invite
router.post('/accept', authenticateToken, requireRole('DEVELOPER'), acceptProject);

// Developer uploads code
router.post('/upload', authenticateToken, requireRole('DEVELOPER'), upload.single('sourceCode'), uploadCode);

// Verification Endpoint
router.post('/verify-details', authenticateToken, requireRole('DEVELOPER'), verifyProjectDetails);
router.get('/:id/download', authenticateToken, downloadCode); 

// Advanced Lock Management
router.post('/lock-request', authenticateToken, requireRole('DEVELOPER'), requestLockModification);
router.post('/lock-approve', authenticateToken, requireRole('CLIENT'), approveLockModification);
router.get('/:id/lock-requests', authenticateToken, getProjectLockRequests);

export default router;