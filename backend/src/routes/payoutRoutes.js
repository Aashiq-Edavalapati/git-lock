
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as PayoutController from '../controllers/payoutController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', PayoutController.getPayouts);
router.post('/', PayoutController.addPayout);
router.delete('/:id', PayoutController.deletePayout);
router.put('/:id/primary', PayoutController.setPrimary);

export default router;
