import asyncHandler from 'express-async-handler';
import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

export const markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson || lesson.course.toString() !== courseId) {
    res.status(404);
    throw new Error('Lesson not found in this course');
  }

  let progress = await Progress.findOne({ user: req.user._id, course: courseId });

  if (!progress) {
    progress = await Progress.create({
      user: req.user._id,
      course: courseId,
      completedLessons: [],
      progressPercentage: 0,
    });
  }

  if (!progress.completedLessons.some((id) => id.toString() === lessonId.toString())) {
    progress.completedLessons.push(lessonId);
  }

  progress.lastAccessedLesson = lessonId;

  const course = await Course.findById(courseId);
  const totalLessons = course.totalLessons || 1;
  progress.progressPercentage = Math.round(
    (progress.completedLessons.length / totalLessons) * 100
  );

  if (progress.progressPercentage >= 100) {
    await Enrollment.findByIdAndUpdate(enrollment._id, { status: 'completed' });
  }

  await progress.save();

  res.json({ success: true, data: progress });
});

export const getProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({
    user: req.user._id,
    course: req.params.courseId,
  }).populate('completedLessons', 'title order');

  if (!progress) {
    res.json({
      success: true,
      data: {
        progressPercentage: 0,
        completedLessons: [],
        lastAccessedLesson: null,
      },
    });
    return;
  }

  res.json({ success: true, data: progress });
});

export const updateLastAccessed = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  let progress = await Progress.findOne({ user: req.user._id, course: courseId });

  if (!progress) {
    progress = await Progress.create({
      user: req.user._id,
      course: courseId,
      lastAccessedLesson: lessonId,
    });
  } else {
    progress.lastAccessedLesson = lessonId;
    await progress.save();
  }

  res.json({ success: true, data: progress });
});
