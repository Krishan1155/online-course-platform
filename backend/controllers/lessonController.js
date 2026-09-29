import asyncHandler from 'express-async-handler';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import { updateCourseStats } from './courseController.js';

export const createLesson = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const { title, description, videoUrl, duration, order, isFree } = req.body;

  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    res.status(404);
    throw new Error('Module not found');
  }

  const lessonCount = await Lesson.countDocuments({ module: moduleId });
  const lesson = await Lesson.create({
    module: moduleId,
    course: moduleDoc.course,
    title,
    description: description || '',
    videoUrl,
    duration: duration || 0,
    order: order !== undefined ? order : lessonCount,
    isFree: isFree === true || isFree === 'true',
  });

  await updateCourseStats(moduleDoc.course);
  res.status(201).json({ success: true, data: lesson });
});

export const updateLesson = asyncHandler(async (req, res) => {
  let lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const { title, description, videoUrl, duration, order, isFree } = req.body;

  lesson.title = title ?? lesson.title;
  lesson.description = description ?? lesson.description;
  lesson.videoUrl = videoUrl ?? lesson.videoUrl;
  if (duration !== undefined) lesson.duration = duration;
  if (order !== undefined) lesson.order = order;
  if (isFree !== undefined) lesson.isFree = isFree === true || isFree === 'true';

  lesson = await lesson.save();
  await updateCourseStats(lesson.course);

  res.json({ success: true, data: lesson });
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const courseId = lesson.course;
  await lesson.deleteOne();
  await updateCourseStats(courseId);

  res.json({ success: true, message: 'Lesson deleted successfully' });
});

export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }
  res.json({ success: true, data: lesson });
});
