import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSummary } from '../controllers/dashboardController.js';

const router = Router();
router.get('/summary', requireAuth, asyncHandler(getSummary));

export default router;
