import express from 'express';
import { listRepos, listCommits } from '../controllers/githubController.js';
import { authenticateToken as protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/repos', protect, listRepos);
router.get('/commits', protect, listCommits);

export default router;