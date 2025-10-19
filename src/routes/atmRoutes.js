import express from 'express';
import { processTransaction } from '../controllers/atmController.js';

const router = express.Router();
router.post('/transaction', processTransaction);
export default router;
