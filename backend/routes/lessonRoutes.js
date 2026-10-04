import express from 'express';

import {
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonById,
} from '../controllers/lessonController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

import {
  uploadDocument,
} from '../middleware/uploadMiddleware.js';

const router = express.Router();

// =====================================================
// GET LESSON
// =====================================================

router.get(
  '/:id',
  protect,
  getLessonById
);

// =====================================================
// CREATE LESSON
// =====================================================

router.post(
  '/module/:moduleId',
  protect,
  authorize('admin'),
  uploadDocument.single('document'),
  createLesson
);

// =====================================================
// UPDATE LESSON
// =====================================================

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadDocument.single('document'),
  updateLesson
);

// =====================================================
// DELETE LESSON
// =====================================================

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteLesson
);

export default router;