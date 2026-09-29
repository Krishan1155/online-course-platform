import express from 'express';
import {
  getCourses,
  getCourseById,
  getCategories,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminCourses,
  getAdminCourseById,
} from '../controllers/courseController.js';
import { protect, authorize, optionalProtect } from '../middleware/authMiddleware.js';
import { uploadThumbnail } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, authorize('admin'), getAdminCourses);
router.get('/admin/:id', protect, authorize('admin'), getAdminCourseById);
router.get('/categories', getCategories);
router.get('/', getCourses);
router.get('/:id', optionalProtect, getCourseById);
router.post('/', protect, authorize('admin'), uploadThumbnail.single('thumbnail'), createCourse);
router.put('/:id', protect, authorize('admin'), uploadThumbnail.single('thumbnail'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

export default router;
