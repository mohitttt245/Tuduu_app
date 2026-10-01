import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createTag, deleteTag, listTags } from '../controllers/tagsController.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listTags));
router.post('/', body('name').trim().isLength({ min: 1, max: 32 }).withMessage('Tag must be between 1 and 32 characters'), validate, asyncHandler(createTag));
router.delete('/:id', param('id').isMongoId(), validate, asyncHandler(deleteTag));

export default router;
