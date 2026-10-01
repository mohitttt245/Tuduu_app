import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoriesController.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listCategories));
router.post('/', body('name').trim().isLength({ min: 1, max: 40 }), body('icon').optional().isLength({ max: 32 }), body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/), validate, asyncHandler(createCategory));
router.put('/:id', param('id').isMongoId(), body('name').trim().isLength({ min: 1, max: 40 }), body('icon').optional().isLength({ max: 32 }), body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/), validate, asyncHandler(updateCategory));
router.delete('/:id', param('id').isMongoId(), validate, asyncHandler(deleteCategory));

export default router;
