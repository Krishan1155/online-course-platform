import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';


/*
  Helper:
  Recalculate progress using the actual lessons
  currently available in the course.
*/
const recalculateProgress = async (userId, courseId) => {
  const lessons = await Lesson.find({
    course: courseId,
  }).select('_id');

  const lessonIds = new Set(
    lessons.map((lesson) =>
      lesson._id.toString()
    )
  );

  let progress = await Progress.findOne({
    user: userId,
    course: courseId,
  });

  if (!progress) {
    progress = await Progress.create({
      user: userId,
      course: courseId,
      completedLessons: [],
      progressPercentage: 0,
    });

    return progress;
  }

  /*
    Remove completed lesson IDs that no longer exist.
  */
  progress.completedLessons =
    progress.completedLessons.filter((lessonId) =>
      lessonIds.has(lessonId.toString())
    );

  const totalLessons = lessons.length;
  const completedLessons =
    progress.completedLessons.length;

  progress.progressPercentage =
    totalLessons > 0
      ? Math.round(
          (completedLessons / totalLessons) * 100
        )
      : 0;

  await progress.save();

  return progress;
};


/*
  Enroll in a free course
*/
export const enrollFreeCourse = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    if (course.price > 0) {
      res.status(400);
      throw new Error(
        'This course requires payment. Use the payment flow.'
      );
    }

    const existing = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existing) {
      res.status(400);
      throw new Error(
        'Already enrolled in this course'
      );
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

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  }
);


/*
  Get courses of current student
*/
export const getMyEnrollments = asyncHandler(
  async (req, res) => {
    const enrollments = await Enrollment.find({
      user: req.user._id,
    })
      .populate({
        path: 'course',
        select:
          'title description thumbnail price category level instructor totalLessons totalDuration',
      })
      .sort({ enrolledAt: -1 });

    /*
      Ignore enrollments whose course was deleted.
    */
    const validEnrollments = enrollments.filter(
      (enrollment) =>
        enrollment.course !== null
    );

    const enrollmentsWithProgress =
      await Promise.all(
        validEnrollments.map(
          async (enrollment) => {
            /*
              IMPORTANT:
              Recalculate progress before returning it.

              Therefore:

              10 / 10 = 100%

              Admin adds 2 lessons

              10 / 12 = 83%
            */
            const progress =
              await recalculateProgress(
                req.user._id,
                enrollment.course._id
              );

            return {
              ...enrollment.toObject(),
              progress: progress || {
                progressPercentage: 0,
                completedLessons: [],
              },
            };
          }
        )
      );

    res.json({
      success: true,
      count: enrollmentsWithProgress.length,
      data: enrollmentsWithProgress,
    });
  }
);


/*
  Check whether current user is enrolled
*/
export const checkEnrollment = asyncHandler(
  async (req, res) => {
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
  }
);


/*
  Get complete course content
*/
export const getCourseContent = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      res.status(403);
      throw new Error(
        'You are not enrolled in this course'
      );
    }

    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    /*
      Recalculate progress when student opens
      the course.
    */
    const progress =
      await recalculateProgress(
        req.user._id,
        courseId
      );

    const modules = await Module.find({
      course: courseId,
    }).sort({ order: 1 });

    const modulesWithLessons =
      await Promise.all(
        modules.map(async (mod) => {
          const lessons = await Lesson.find({
            module: mod._id,
          }).sort({ order: 1 });

          return {
            ...mod.toObject(),
            lessons,
          };
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
  }
);


/*
  Get all enrollments for admin
*/
export const getAllEnrollments = asyncHandler(
  async (req, res) => {
    const enrollments = await Enrollment.find()
      .populate('user', 'name email')
      .populate('course', 'title price')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  }
);