import express from 'express';
import {
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonById,
} from '../controllers/lessonController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', protect, getLessonById);
router.post('/module/:moduleId', protect, authorize('admin'), createLesson);
router.put('/:id', protect, authorize('admin'), updateLesson);
router.delete('/:id', protect, authorize('admin'), deleteLesson);

export default router;
