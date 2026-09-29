import asyncHandler from 'express-async-handler';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { updateCourseStats } from './courseController.js';

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

  await Lesson.deleteMany({ module: module._id });
  await module.deleteOne();
  await updateCourseStats(module.course);

  res.json({ success: true, message: 'Module deleted successfully' });
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
