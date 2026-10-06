import express from 'express';

import {
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
} from '../controllers/reviewController.js';

import {
  protect,
  optionalProtect,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: anyone can see reviews
router.get(
  '/course/:courseId',
  optionalProtect,
  getCourseReviews
);

// Enrolled students only
router.post(
  '/course/:courseId',
  protect,
  createReview
);

// Student's own review
router.put(
  '/:reviewId',
  protect,
  updateReview
);

router.delete(
  '/:reviewId',
  protect,
  deleteReview
);

// Helpful / not helpful
router.post(
  '/:reviewId/helpful',
  protect,
  markReviewHelpful
);

export default router;