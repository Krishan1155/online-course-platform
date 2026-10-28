import express from 'express';

import {
  markLessonComplete,
  getProgress,
  updateLastAccessed,
  savePlaybackPosition,
} from '../controllers/progressController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:courseId', protect, getProgress);

router.post('/:courseId/lesson/:lessonId/complete', protect, markLessonComplete);

router.put('/:courseId/lesson/:lessonId/access', protect, updateLastAccessed);

router.put('/:courseId/lesson/:lessonId/playback',protect,savePlaybackPosition);

export default router;