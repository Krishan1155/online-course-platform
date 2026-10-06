import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';

const updateCourseStats = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });

  const totalLessons = lessons.length;

  const totalDuration = lessons.reduce(
    (sum, l) => sum + (l.duration || 0),
    0
  );

  await Course.findByIdAndUpdate(
    courseId,
    {
      totalLessons,
      totalDuration,
    }
  );
};

export const getCourses = asyncHandler(
  async (req, res) => {
    const {
      search,
      category,
      level,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const filter = {
      isPublished: true,
    };

    if (search) {
      filter.$text = {
        $search: search,
      };
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let sortOption = {
      createdAt: -1,
    };

    if (sort === 'price-asc') {
      sortOption = {
        price: 1,
      };
    }

    if (sort === 'price-desc') {
      sortOption = {
        price: -1,
      };
    }

    if (sort === 'title') {
      sortOption = {
        title: 1,
      };
    }

    const courses = await Course.find(filter)
      .sort(sortOption)
      .populate(
        'createdBy',
        'name'
      );

    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  }
);

export const getCourseById = asyncHandler(
  async (req, res) => {
    const course =
      await Course.findById(req.params.id)
        .populate(
          'createdBy',
          'name email'
        );

    if (!course) {
      res.status(404);
      throw new Error(
        'Course not found'
      );
    }

    if (
      !course.isPublished &&
      (!req.user ||
        req.user.role !== 'admin')
    ) {
      res.status(404);
      throw new Error(
        'Course not found'
      );
    }

    const modules =
      await Module.find({
        course: course._id,
      }).sort({
        order: 1,
      });

    const modulesWithLessons =
      await Promise.all(
        modules.map(
          async (mod) => {
            const lessons =
              await Lesson.find({
                module: mod._id,
              }).sort({
                order: 1,
              });

            return {
              ...mod.toObject(),
              lessons,
            };
          }
        )
      );

    let isEnrolled = false;

    if (req.user) {
      const enrollment =
        await Enrollment.findOne({
          user: req.user._id,
          course: course._id,
        });

      isEnrolled = !!enrollment;
    }

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        modules:
          modulesWithLessons,
        isEnrolled,
      },
    });
  }
);

export const getCategories =
  asyncHandler(
    async (req, res) => {
      const categories =
        await Course.distinct(
          'category',
          {
            isPublished: true,
          }
        );

      res.json({
        success: true,
        data: categories,
      });
    }
  );

export const createCourse =
  asyncHandler(
    async (req, res) => {
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
        level:
          level || 'beginner',
        instructor,
        isPublished:
          isPublished === 'true' ||
          isPublished === true,
        createdBy: req.user._id,
      };

      if (req.file) {
        courseData.thumbnail =
          `/uploads/${req.file.filename}`;
      }

      const course =
        await Course.create(
          courseData
        );

      res.status(201).json({
        success: true,
        data: course,
      });
    }
  );

export const updateCourse =
  asyncHandler(
    async (req, res) => {
      let course =
        await Course.findById(
          req.params.id
        );

      if (!course) {
        res.status(404);
        throw new Error(
          'Course not found'
        );
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

      course.title =
        title ?? course.title;

      course.description =
        description ??
        course.description;

      course.price =
        price !== undefined
          ? price
          : course.price;

      course.category =
        category ??
        course.category;

      course.level =
        level ?? course.level;

      course.instructor =
        instructor ??
        course.instructor;

      if (
        isPublished !==
        undefined
      ) {
        course.isPublished =
          isPublished ===
            'true' ||
          isPublished === true;
      }

      if (req.file) {
        course.thumbnail =
          `/uploads/${req.file.filename}`;
      }

      course =
        await course.save();

      res.json({
        success: true,
        data: course,
      });
    }
  );

export const deleteCourse =
  asyncHandler(
    async (req, res) => {
      const course =
        await Course.findById(
          req.params.id
        );

      if (!course) {
        res.status(404);
        throw new Error(
          'Course not found'
        );
      }

      await Lesson.deleteMany({
        course: course._id,
      });

      await Module.deleteMany({
        course: course._id,
      });

      // Delete all reviews belonging
      // to this course.
      await Review.deleteMany({
        course: course._id,
      });

      await course.deleteOne();

      res.json({
        success: true,
        message:
          'Course deleted successfully',
      });
    }
  );

export const getAdminCourses =
  asyncHandler(
    async (req, res) => {
      const courses =
        await Course.find()
          .sort({
            createdAt: -1,
          })
          .populate(
            'createdBy',
            'name'
          );

      res.json({
        success: true,
        count: courses.length,
        data: courses,
      });
    }
  );

export const getAdminCourseById =
  asyncHandler(
    async (req, res) => {
      const course =
        await Course.findById(
          req.params.id
        );

      if (!course) {
        res.status(404);
        throw new Error(
          'Course not found'
        );
      }

      const modules =
        await Module.find({
          course: course._id,
        }).sort({
          order: 1,
        });

      const modulesWithLessons =
        await Promise.all(
          modules.map(
            async (mod) => {
              const lessons =
                await Lesson.find({
                  module: mod._id,
                }).sort({
                  order: 1,
                });

              return {
                ...mod.toObject(),
                lessons,
              };
            }
          )
        );

      res.json({
        success: true,
        data: {
          ...course.toObject(),
          modules:
            modulesWithLessons,
        },
      });
    }
  );

export {
  updateCourseStats,
};