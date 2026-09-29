import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';

export const enrollFreeCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.price > 0) {
    res.status(400);
    throw new Error('This course requires payment. Use the payment flow.');
  }

  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  const enrollment = await Enrollment.create({
    user: req.user._id,
    course: courseId,
  });

  await Progress.create({
    user: req.user._id,
    course: courseId,
    completedLessons: [],
    progressPercentage: 0,
  });

  res.status(201).json({ success: true, data: enrollment });
});

export const getMyEnrollments = asyncHandler(async (req, res) => {

  const enrollments = await Enrollment.find({
    user: req.user._id,
    //status: 'active',
  })
    .populate({
      path: 'course',
      select:
        'title description thumbnail price category level instructor totalLessons totalDuration',
    })
    .sort({ enrolledAt: -1 });

  // Remove old enrollments whose course was deleted
  const validEnrollments = enrollments.filter(
    (enrollment) => enrollment.course !== null
  );

  const enrollmentsWithProgress = await Promise.all(
    validEnrollments.map(async (enrollment) => {

      const progress = await Progress.findOne({
        user: req.user._id,
        course: enrollment.course._id,
      });

      return {
        ...enrollment.toObject(),

        progress: progress || {
          progressPercentage: 0,
          completedLessons: [],
        },
      };
    })
  );

  res.json({
    success: true,
    count: enrollmentsWithProgress.length,
    data: enrollmentsWithProgress,
  });
});

export const checkEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: req.params.courseId,
  });

  res.json({
    success: true,
    data: {
      isEnrolled: !!enrollment,
      enrollment,
    },
  });
});

export const getCourseContent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  const course = await Course.findById(courseId);
  const progress = await Progress.findOne({ user: req.user._id, course: courseId });

  const modules = await Module.find({ course: courseId }).sort({ order: 1 });
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await Lesson.find({ module: mod._id }).sort({ order: 1 });
      return { ...mod.toObject(), lessons };
    })
  );

  res.json({
    success: true,
    data: {
      course,
      modules: modulesWithLessons,
      progress,
    },
  });
});

export const getAllEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find()
    .populate('user', 'name email')
    .populate('course', 'title price')
    .sort({ enrolledAt: -1 });

  res.json({ success: true, count: enrollments.length, data: enrollments });
});
