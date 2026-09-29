import express from 'express';
import {
  createModule,
  updateModule,
  deleteModule,
  getModulesByCourse,
} from '../controllers/moduleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', protect, getModulesByCourse);
router.post('/course/:courseId', protect, authorize('admin'), createModule);
router.put('/:id', protect, authorize('admin'), updateModule);
router.delete('/:id', protect, authorize('admin'), deleteModule);

export default router;
