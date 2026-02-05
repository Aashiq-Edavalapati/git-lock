import express from 'express';
import multer from 'multer';
import { acceptProject, initProject, inviteDeveloper, uploadCode, listProjects, getProject, verifyProjectDetails, downloadCode, requestLockModification, approveLockModification, getProjectLockRequests, removeDeveloper, editProject, deleteProject, updateSafeDetails, requestBudgetUpdate, approveBudgetUpdate, rejectBudgetUpdate, sendBudgetApprovalOTP, revokeProjectAcceptance } from '../controllers/projectController.js';
import { getPaymentLogs } from '../controllers/auditController.js';
import { authenticateToken, requireRole, checkAcl } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure Multer (Memory Storage - we process file in RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// List my projects (This lists snippets, maybe Apply Read Project Details ACL to individual get)
router.get('/', authenticateToken, listProjects);

// ACL: PROJECT DETAILS (Client: Create/Read, Developer: Read/Accept, Admin: Read)
router.get('/:id', authenticateToken, checkAcl('PROJECT_DETAILS', 'READ'), getProject);

/* 
 * ACL: PAYMENT LOGS 
 * Client: Create/Read, Developer: No Access, Admin: Read
 */
router.get('/:id/payments', authenticateToken, checkAcl('PAYMENT_LOGS', 'READ'), getPaymentLogs);


router.put('/:id', authenticateToken, requireRole('CLIENT'), editProject);
router.put('/:id/safe', authenticateToken, requireRole('CLIENT'), updateSafeDetails);
router.post('/:id/budget-request', authenticateToken, requireRole('CLIENT'), requestBudgetUpdate);
router.post('/:id/budget-approve-otp', authenticateToken, requireRole('DEVELOPER'), sendBudgetApprovalOTP);
router.post('/:id/budget-approve', authenticateToken, requireRole('DEVELOPER'), approveBudgetUpdate);
router.post('/:id/budget-reject', authenticateToken, requireRole('DEVELOPER'), rejectBudgetUpdate);
router.delete('/:id', authenticateToken, requireRole('CLIENT'), deleteProject);

// Client creates project
// ACL: PROJECT DETAILS - CREATE (Only Client)
router.post('/create', authenticateToken, checkAcl('PROJECT_DETAILS', 'CREATE'), initProject);

// Client invites developer later
router.post('/invite', authenticateToken, requireRole('CLIENT'), upload.array('attachments'), inviteDeveloper);
router.post('/cancel-invite', authenticateToken, requireRole('CLIENT'), removeDeveloper);

// Developer accepts invite
// ACL: PROJECT DETAILS - ACCEPT (Only Developer)
router.post('/accept', authenticateToken, checkAcl('PROJECT_DETAILS', 'ACCEPT'), acceptProject);
router.post('/:id/revoke', authenticateToken, requireRole('DEVELOPER'), revokeProjectAcceptance);

// Developer uploads code
// ACL: SOURCE CODE - UPLOAD (Only Developer)
router.post('/upload', authenticateToken, checkAcl('SOURCE_CODE', 'UPLOAD'), upload.single('sourceCode'), uploadCode);

// Verification Endpoint
router.post('/verify-details', authenticateToken, requireRole('DEVELOPER'), verifyProjectDetails);

// ACL: SOURCE CODE - READ (Client, Developer, Admin: NO ACCESS)
// Note: Logic inside downloadCode handles the "Only after unlock for Client" and "Always for Developer"
// Admin should be blocked by checkAcl('SOURCE_CODE', 'READ') if we want to enforce it strictly here,
// But downloadCode has specific logic. Let's wrap it.
router.get('/:id/download', authenticateToken, checkAcl('SOURCE_CODE', 'READ'), downloadCode); 

// Advanced Lock Management
router.post('/lock-request', authenticateToken, requireRole('DEVELOPER'), requestLockModification);
router.post('/lock-approve', authenticateToken, requireRole('CLIENT'), approveLockModification);
router.get('/:id/lock-requests', authenticateToken, getProjectLockRequests);

export default router;