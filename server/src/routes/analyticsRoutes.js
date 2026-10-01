import { Router } from 'express';
import { query } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();
router.get('/', requireAuth, query('range').optional().isIn(['7', '30', '90', 'all']), validate, asyncHandler(getAnalytics));

export default router;
