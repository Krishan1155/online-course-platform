import express from 'express';

import {
  enrollFreeCourse,
  getMyEnrollments,
  checkEnrollment,
  getCourseContent,
  getAllEnrollments,
} from '../controllers/enrollmentController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

const router =
  express.Router();

// =====================================================
// STUDENT
// =====================================================

router.get(
  '/my',
  protect,
  getMyEnrollments
);

router.get(
  '/check/:courseId',
  protect,
  checkEnrollment
);

router.get(
  '/content/:courseId',
  protect,
  getCourseContent
);

router.post(
  '/free/:courseId',
  protect,
  enrollFreeCourse
);

// =====================================================
// ADMIN
// =====================================================

router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  getAllEnrollments
);

export default router;