import asyncHandler from 'express-async-handler';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { updateCourseStats } from './courseController.js';
import { deleteFromS3 } from '../utils/s3.js';

export const createModule = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, order } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const moduleCount = await Module.countDocuments({ course: courseId });
  const module = await Module.create({
    course: courseId,
    title,
    order: order !== undefined ? order : moduleCount,
  });

  res.status(201).json({ success: true, data: module });
});

export const updateModule = asyncHandler(async (req, res) => {
  let module = await Module.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

  module.title = req.body.title ?? module.title;
  if (req.body.order !== undefined) module.order = req.body.order;

  module = await module.save();
  res.json({ success: true, data: module });
});


export const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);

  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

  const courseId = module.course;

  // Find all lessons in this module
  const lessons = await Lesson.find({
    module: module._id,
  }).select('videoKey documentKey');

  // Collect video and document keys stored in S3
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

  // Delete S3 objects first
  for (const key of s3Keys) {
    await deleteFromS3(key);
  }

  // Delete lesson and module records
  await Lesson.deleteMany({ module: module._id });
  await module.deleteOne();

  // Update course lesson count and duration
  await updateCourseStats(courseId);

  res.json({
    success: true,
    message:
      'Module, lessons, and associated S3 files deleted successfully',
  });
});


export const getModulesByCourse = asyncHandler(async (req, res) => {
  const modules = await Module.find({ course: req.params.courseId }).sort({ order: 1 });

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await Lesson.find({ module: mod._id }).sort({ order: 1 });
      return { ...mod.toObject(), lessons };
    })
  );

  res.json({ success: true, data: modulesWithLessons });
});
