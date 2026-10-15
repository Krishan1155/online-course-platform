import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';
import { deleteS3Prefix } from '../utils/s3.js';
import Progress from '../models/Progress.js';

// =====================================================
// UPDATE COURSE STATISTICS
// =====================================================

const updateCourseStats = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });

  const totalLessons = lessons.length;

  const totalDuration = lessons.reduce(
    (sum, lesson) => sum + (lesson.duration || 0),
    0
  );

  await Course.findByIdAndUpdate(courseId, {
    totalLessons,
    totalDuration,
  });
};

// =====================================================
// GET ALL PUBLISHED COURSES
// =====================================================

export const getCourses = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    level,
    minPrice,
    maxPrice,
    sort,
  } = req.query;

  const filter = { isPublished: true };
  const searchText = search?.trim();

  if (searchText) {
    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const searchRegex = new RegExp(
      escapeRegex(searchText),
      'i'
    );

    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { instructor: searchRegex },
    ];
  }

  if (category) filter.category = category;
  if (level) filter.level = level;

  if (minPrice !== undefined && minPrice !== '') {
    filter.price = {
      ...filter.price,
      $gte: Number(minPrice),
    };
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    filter.price = {
      ...filter.price,
      $lte: Number(maxPrice),
    };
  }

  let sortOption = { createdAt: -1 };

  if (sort === 'price-asc') {
    sortOption = { price: 1, title: 1 };
  } else if (sort === 'price-desc') {
    sortOption = { price: -1, title: 1 };
  } else if (sort === 'title') {
    sortOption = { title: 1 };
  }

  const courses = await Course.find(filter)
    .sort(sortOption)
    .populate('createdBy', 'name');

  let result = courses;

  if (searchText) {
    const query = searchText.toLowerCase();

    const getRank = (course) => {
      const title = (course.title || '').toLowerCase();

      if (title === query) return 0;
      if (title.startsWith(query)) return 1;
      if (title.includes(query)) return 2;

      return 3;
    };

    result = [...courses].sort(
      (a, b) => getRank(a) - getRank(b)
    );
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// =====================================================
// GET COURSE BY ID
// =====================================================

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!course.isPublished &&
      (!req.user || req.user.role !== 'admin')) {
    res.status(404);
    throw new Error('Course not found');
  }

  const modules = await Module.find({
    course: course._id,
  }).sort({ order: 1 });

  const modulesWithLessons = await Promise.all(
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

  let isEnrolled = false;

  if (req.user) {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    isEnrolled = !!enrollment;
  }

  res.json({
    success: true,
    data: {
      ...course.toObject(),
      modules: modulesWithLessons,
      isEnrolled,
    },
  });
});

// =====================================================
// GET CATEGORIES
// =====================================================

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct('category', {
    isPublished: true,
  });

  res.json({
    success: true,
    data: categories,
  });
});

// =====================================================
// CREATE COURSE
// =====================================================

export const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    level,
    instructor,
    isPublished,
  } = req.body;

  const courseData = {
    title,
    description,
    price: price || 0,
    category,
    level: level || 'beginner',
    instructor,
    isPublished:
      isPublished === 'true' || isPublished === true,
    createdBy: req.user._id,
  };

  if (req.file) {
    courseData.thumbnail = `/uploads/${req.file.filename}`;
  }

  const course = await Course.create(courseData);

  res.status(201).json({
    success: true,
    data: course,
  });
});

// =====================================================
// UPDATE COURSE
// =====================================================

export const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const {
    title,
    description,
    price,
    category,
    level,
    instructor,
    isPublished,
  } = req.body;

  course.title = title ?? course.title;
  course.description = description ?? course.description;
  course.price = price !== undefined ? price : course.price;
  course.category = category ?? course.category;
  course.level = level ?? course.level;
  course.instructor = instructor ?? course.instructor;

  if (isPublished !== undefined) {
    course.isPublished =
      isPublished === 'true' || isPublished === true;
  }

  if (req.file) {
    course.thumbnail = `/uploads/${req.file.filename}`;
  }

  course = await course.save();

  res.json({
    success: true,
    data: course,
  });
});

// =====================================================
// DELETE COURSE
// =====================================================


export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const courseId = course._id;

  // 1. Find all lessons and their S3 keys
  const lessons = await Lesson.find({
    course: courseId,
  }).select('videoKey documentKey');

  const s3Keys = [
    ...new Set(
      lessons
        .flatMap((lesson) => [
          lesson.videoKey,
          lesson.documentKey,
        ])
        .filter(Boolean)
    ),
  ];

  // 2. Delete S3 files first.
  // If this fails, MongoDB deletion will not start.
  for (const key of s3Keys) {
    // Delete every S3 object belonging to this course
await deleteS3Prefix(`courses/${courseId}/`);
  }

  // 3. Delete related MongoDB records
  await Promise.all([
    Lesson.deleteMany({ course: courseId }),
    Module.deleteMany({ course: courseId }),
    Review.deleteMany({ course: courseId }),
    Enrollment.deleteMany({ course: courseId }),
    Progress.deleteMany({ course: courseId }),
  ]);

  // 4. Delete the course
  await course.deleteOne();

  res.json({
    success: true,
    message:
      'Course, related MongoDB records, and associated S3 files deleted successfully',
  });
});


// =====================================================
// GET ADMIN COURSES
// =====================================================

export const getAdminCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');

  res.json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// =====================================================
// GET ADMIN COURSE BY ID
// =====================================================

export const getAdminCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const modules = await Module.find({
    course: course._id,
  }).sort({ order: 1 });

  const modulesWithLessons = await Promise.all(
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
      ...course.toObject(),
      modules: modulesWithLessons,
    },
  });
});

// =====================================================
// EXPORT COURSE STATISTICS HELPER
// =====================================================

export { updateCourseStats };