
import express from 'express';

import {
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonById,
  getLessonPlaybackUrl,
} from '../controllers/lessonController.js';
import {protect,authorize} from '../middleware/authMiddleware.js';

import {uploadLessonMedia} from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ---> Get playback URL for a selected lesson.
router.get('/:courseId/:lessonId/playback-url',protect,getLessonPlaybackUrl);

// ---> Get lesson details.
router.get('/:id', protect, getLessonById);

// ---> Admin creates a lesson with an optional video or PDF upload.
router.post(
  '/module/:moduleId',
  protect,
  authorize('admin'),
  uploadLessonMedia.fields([
    { name: 'video', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]),
  createLesson
);

// ---> Admin updates lesson details or replaces its media.
router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadLessonMedia.fields([
    { name: 'video', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]),
  updateLesson
);

// ---> Preserve the existing delete handler.
router.delete('/:id',protect,authorize('admin'),deleteLesson);

export default router;