import express from 'express';
import {
  getConfig,
  getProjectEscrowStatus,
  approveDeployment,
  recordEscrowFunding,
  verifyOwnershipAndAttest,
  recordPaymentRelease,
  updateWalletAddress
} from '../controllers/escrowController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get public blockchain escrow config
router.get('/config', getConfig);

// 2. Get escrow state for a specific project
router.get('/status/:projectId', authenticateToken, getProjectEscrowStatus);

// 3. Step 3: Client Approves Deployment
router.post('/approve-deployment', authenticateToken, requireRole('CLIENT'), approveDeployment);

// 4. Step 4: Client Records Escrow Funding
router.post('/record-funding', authenticateToken, requireRole('CLIENT'), recordEscrowFunding);

// 5. Step 5 & 6: Verify GitHub Repo Ownership & Sign Oracle Attestation
router.post('/verify-ownership', authenticateToken, verifyOwnershipAndAttest);

// 6. Step 7: Record Payment Release on Blockchain
router.post('/record-release', authenticateToken, recordPaymentRelease);

// 7. Save connected wallet address
router.post('/wallet', authenticateToken, updateWalletAddress);

export default router;
