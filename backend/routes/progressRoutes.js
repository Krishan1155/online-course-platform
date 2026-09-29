import express from 'express';
import {
  markLessonComplete,
  getProgress,
  updateLastAccessed,
} from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:courseId', protect, getProgress);
router.post('/:courseId/lesson/:lessonId/complete', protect, markLessonComplete);
router.put('/:courseId/lesson/:lessonId/access', protect, updateLastAccessed);

export default router;
