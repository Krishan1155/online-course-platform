import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

// =====================================================
// UPDATE COURSE RATING STATISTICS
// =====================================================

const updateCourseRating = async (courseId) => {
  const reviews = await Review.find({
    course: courseId,
  }).select('rating');

  const ratingCount = reviews.length;

  if (ratingCount === 0) {
    await Course.findByIdAndUpdate(courseId, {
      ratingAverage: 0,
      ratingCount: 0,
      ratingDistribution: {
        five: 0,
        four: 0,
        three: 0,
        two: 0,
        one: 0,
      },
    });

    return;
  }

  const totalRating = reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  const ratingAverage = Number(
    (totalRating / ratingCount).toFixed(1)
  );

  const ratingDistribution = {
    five: reviews.filter((review) => review.rating === 5).length,
    four: reviews.filter((review) => review.rating === 4).length,
    three: reviews.filter((review) => review.rating === 3).length,
    two: reviews.filter((review) => review.rating === 2).length,
    one: reviews.filter((review) => review.rating === 1).length,
  };

  await Course.findByIdAndUpdate(courseId, {
    ratingAverage,
    ratingCount,
    ratingDistribution,
  });
};

// =====================================================
// GET COURSE REVIEWS
// PUBLIC
// =====================================================

export const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId).select('_id');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const reviews = await Review.find({
    course: courseId,
  })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  let userReview = null;

  if (req.user) {
    userReview = reviews.find(
      (review) =>
        review.user?._id?.toString() ===
        req.user._id.toString()
    );
  }

  const safeReviews = reviews.map((review) => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    user: review.user,
    createdAt: review.createdAt,
    helpfulCount: review.helpfulBy.length,
    notHelpfulCount: review.notHelpfulBy.length,
    isHelpful: req.user
      ? review.helpfulBy.some(
          (id) =>
            id.toString() === req.user._id.toString()
        )
      : false,
    isNotHelpful: req.user
      ? review.notHelpfulBy.some(
          (id) =>
            id.toString() === req.user._id.toString()
        )
      : false,
  }));

  res.json({
    success: true,
    count: safeReviews.length,
    data: {
      reviews: safeReviews,
      userReview: userReview
        ? {
            _id: userReview._id,
            rating: userReview.rating,
            comment: userReview.comment,
          }
        : null,
    },
  });
});

// =====================================================
// CREATE REVIEW
// ENROLLED STUDENTS ONLY
// =====================================================

export const createReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!enrollment) {
    res.status(403);
    throw new Error(
      'You must be enrolled in this course to write a review'
    );
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (existingReview) {
    res.status(400);
    throw new Error(
      'You have already reviewed this course'
    );
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    res.status(400);
    throw new Error(
      'Rating must be between 1 and 5'
    );
  }

  if (!comment || !comment.trim()) {
    res.status(400);
    throw new Error('Review comment is required');
  }

  const review = await Review.create({
    user: req.user._id,
    course: courseId,
    rating: numericRating,
    comment: comment.trim(),
  });

  await updateCourseRating(courseId);

  const populatedReview = await Review.findById(
    review._id
  ).populate('user', 'name');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: populatedReview,
  });
});

// =====================================================
// UPDATE OWN REVIEW
// =====================================================

export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (
    review.user.toString() !==
    req.user._id.toString()
  ) {
    res.status(403);
    throw new Error(
      'You can only edit your own review'
    );
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    res.status(400);
    throw new Error(
      'Rating must be between 1 and 5'
    );
  }

  if (!comment || !comment.trim()) {
    res.status(400);
    throw new Error('Review comment is required');
  }

  review.rating = numericRating;
  review.comment = comment.trim();

  await review.save();

  await updateCourseRating(review.course);

  const updatedReview = await Review.findById(
    review._id
  ).populate('user', 'name');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview,
  });
});

// =====================================================
// DELETE OWN REVIEW
// =====================================================

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (
    review.user.toString() !==
    req.user._id.toString()
  ) {
    res.status(403);
    throw new Error(
      'You can only delete your own review'
    );
  }

  const courseId = review.course;

  await review.deleteOne();

  await updateCourseRating(courseId);

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

// =====================================================
// HELPFUL / NOT HELPFUL
// =====================================================

export const markReviewHelpful = asyncHandler(
  async (req, res) => {
    const { reviewId } = req.params;
    const { helpful } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    const userId = req.user._id;

    review.helpfulBy = review.helpfulBy.filter(
      (id) =>
        id.toString() !== userId.toString()
    );

    review.notHelpfulBy =
      review.notHelpfulBy.filter(
        (id) =>
          id.toString() !== userId.toString()
      );

    if (helpful === true) {
      review.helpfulBy.push(userId);
    }

    if (helpful === false) {
      review.notHelpfulBy.push(userId);
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulBy.length,
        notHelpfulCount:
          review.notHelpfulBy.length,
      },
    });
  }
);