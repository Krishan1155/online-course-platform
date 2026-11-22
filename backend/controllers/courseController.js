import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';
import { deleteS3Prefix } from '../utils/s3.js';
import Progress from '../models/Progress.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

// Update  Course STATISTICS

const updateCourseStats = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });

  const totalLessons = lessons.length;

  const totalDuration = lessons.reduce((sum, lesson) => 
    sum + (lesson.duration || 0),0
  );

  await Course.findByIdAndUpdate(courseId, {
    totalLessons,
    totalDuration,
  });
};


// Get All Published Courses
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

  if (searchText) 
  {
    //Regular expressions (Regex) use special characters to perform pattern matching
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    //It adds a backslash before special Regex characters so they are treated as normal characters.
    //c++ -> c\\+\\+

    const searchRegex = new RegExp(escapeRegex(searchText),'i');

    //Search in multiple fields
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { instructor: searchRegex },
    ];
  }

  //adding in filter 

  if (category) filter.category = category;

  if (level) filter.level = level;

  if (minPrice !== undefined && minPrice !== '') 
  {
    filter.price = {
      //It preserves existing price conditions when adding another condition.
      ...filter.price,
      $gte: Number(minPrice),
    };
  }

  if (maxPrice !== undefined && maxPrice !== '') 
  {
    filter.price = {
      ...filter.price,
      $lte: Number(maxPrice),
    };
  }

  let sortOption = { createdAt: -1 };

  if (sort === 'price-asc') 
  {
    sortOption = { price: 1, title: 1 };
  } 
  else if (sort === 'price-desc') 
  {
    sortOption = { price: -1, title: 1 };
  } 
  else if (sort === 'title') 
  {
    sortOption = { title: 1 };
  }

  const courses = await Course.find(filter).sort(sortOption).populate('createdBy', 'name');

  let result = courses;

  if (searchText) 
  {
    const query = searchText.toLowerCase();

    const getRank = (course) => {
    
    const title = (course.title || '').toLowerCase();

    if (title === query) return 0;

    if (title.startsWith(query)) return 1;

    if (title.includes(query)) return 2;

  return 3;
    };

    result = [...courses].sort((a, b) => getRank(a) - getRank(b)); //puts the lower-ranked number first.
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});



// ----> Get Course By Id

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!course) 
  {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!course.isPublished) 
  {
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

  if(req.user) 
  {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    isEnrolled = !!enrollment;   //The double exclamation mark converts a value to a Boolean.
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


// Get Categories

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct('category', {
    isPublished: true,
  });

  res.json({
    success: true,
    data: categories,
  });
});


// ----> Create Course

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
    isPublished: isPublished === 'true' || isPublished === true,                //When data is submitted through FormData, Boolean values commonly arrive as strings.
    createdBy: req.user._id,
  };

  if (req.file) 
  {
    courseData.thumbnail = `/uploads/${req.file.filename}`;
  }

  const course = await Course.create(courseData);

  res.status(201).json({
    success: true,
    data: course,
  });
});

// ---> Update Course

export const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) 
  {
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


  course.title = title ?? course.title;                    // ?? operator is called the nullish coalescing operator.
  course.description = description ?? course.description;
  course.price = price !== undefined ? price : course.price;
  course.category = category ?? course.category;
  course.level = level ?? course.level;
  course.instructor = instructor ?? course.instructor;

  if(isPublished !== undefined) 
  {
    course.isPublished = isPublished === 'true' || isPublished === true;
  }

  if(req.file) 
  {
    course.thumbnail = `/uploads/${req.file.filename}`;
  }

  course = await course.save();

  res.json({
    success: true,
    data: course,
  });
});


// ---> Delete Course

export const deleteCourse = asyncHandler(async (req, res) => {

  const course = await Course.findById(req.params.id);

  if (!course) 
  {
    res.status(404);
    throw new Error('Course not found');
  }

  const courseId = course._id;
  const session = await mongoose.startSession();

  //Delete all related MongoDB records in one transaction
  try {
    await session.withTransaction(async () => {
      await Lesson.deleteMany({ course: courseId }).session(session);
      await Module.deleteMany({ course: courseId }).session(session);
      await Review.deleteMany({ course: courseId }).session(session);
      await Enrollment.deleteMany({ course: courseId }).session(session);
      await Progress.deleteMany({ course: courseId }).session(session);

      await Course.deleteOne({ _id: courseId }).session(session);

    });
    // delete from s3.
  } 
  finally {
    await session.endSession(); //closes the session after the transaction finishes
  }

  //Delete all S3 files belonging to this course
  try 
  {
  await deleteS3Prefix(`courses/${courseId}/`);
  } 
catch (error) 
{
  console.error('S3 course cleanup failed:', error);
}

  //Delete course thumbnail from local uploads folder
  if (course.thumbnail) {
    const thumbnailFilename = path.basename(course.thumbnail);

    const thumbnailPath = path.join(
      process.cwd(),
      'uploads',
      thumbnailFilename
    );

    try {
      await fs.unlink(thumbnailPath);
    } 
    catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Thumbnail cleanup failed:', error);
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Course and all related records deleted successfully',
  });
});


// Get Admin Courses

export const getAdminCourses = asyncHandler(async (req, res) => {

  const courses = await Course.find()
    //newest first
    .sort({ createdAt: -1 })    
    .populate('createdBy', 'name');

  res.json({
    success: true,
    count: courses.length,
    data: courses,
  });
});


// ---> Get Admin Course By ID

export const getAdminCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) 
  {
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


// --->EXPORT COURSE STATISTICS HELPER

export { updateCourseStats };