import express from 'express';
import { processTransaction, getResourceStatus, emergencyRelease } from '../controllers/atmController.js';

const router = express.Router();

// Process ATM transaction
router.post('/transaction', processTransaction);

// Get resource status
router.get('/status', getResourceStatus);

// Emergency release (for testing/debugging)
router.post('/emergency-release', emergencyRelease);

export default router;