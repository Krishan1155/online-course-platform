import asyncHandler from 'express-async-handler';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import { updateCourseStats } from './courseController.js';
import Progress from '../models/Progress.js';


// re calculate progress
  const refreshCourseProgress = async (courseId) => {
  const lessons = await Lesson.find({
    course: courseId,
  }).select('_id');

  const lessonIds = new Set(
    lessons.map((lesson) =>
      lesson._id.toString()
    )
  );

  const progressRecords = await Progress.find({
    course: courseId,
  });

  await Promise.all(
    progressRecords.map(async (progress) => {
      progress.completedLessons =
        progress.completedLessons.filter((lessonId) =>
          lessonIds.has(lessonId.toString())
        );

      progress.progressPercentage =
        lessons.length > 0
          ? Math.round(
              (progress.completedLessons.length /
                lessons.length) *
                100
            )
          : 0;

      await progress.save();
    })
  );
};


// =====================================================
// CREATE LESSON / CONTENT
// =====================================================

export const createLesson = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  const {
    title,
    description,
    contentType,
    documentType,
    documentText,
    videoUrl,
    documentUrl,
    codingQuestion,
    starterCode,
    duration,
    order,
  } = req.body;


  

  // -----------------------------------------------------
  // Find module
  // -----------------------------------------------------

  const moduleDoc = await Module.findById(moduleId);

  if (!moduleDoc) {
    res.status(404);
    throw new Error('Module not found');
  }

  // -----------------------------------------------------
  // Basic validation
  // -----------------------------------------------------

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Lesson title is required');
  }

  const selectedContentType = contentType || 'video';

  // -----------------------------------------------------
  // VIDEO
  // -----------------------------------------------------

  if (selectedContentType === 'video') {
    if (!videoUrl || !videoUrl.trim()) {
      res.status(400);
      throw new Error('Video URL is required for video content');
    }
  }

  // -----------------------------------------------------
  // DOCUMENT
  // -----------------------------------------------------

  if (selectedContentType === 'document') {
    const selectedDocumentType = documentType || 'pdf';

    // PDF
    if (selectedDocumentType === 'pdf') {
      if (!req.file) {
        res.status(400);
        throw new Error('Please upload a PDF document');
      }
    }

    // WEB URL
    if (selectedDocumentType === 'url') {
      if (!documentUrl || !documentUrl.trim()) {
        res.status(400);
        throw new Error('Documentation URL is required');
      }
    }

    // TEXT
    if (selectedDocumentType === 'text') {
      if (!documentText || !documentText.trim()) {
        res.status(400);
        throw new Error('Document text is required');
      }
    }
  }

  // -----------------------------------------------------
  // CODING
  // -----------------------------------------------------

  if (selectedContentType === 'coding') {
    if (!codingQuestion || !codingQuestion.trim()) {
      res.status(400);
      throw new Error('Coding question is required');
    }
  }

  // -----------------------------------------------------
  // Get lesson count
  // -----------------------------------------------------

  const lessonCount = await Lesson.countDocuments({
    module: moduleId,
  });

  // -----------------------------------------------------
  // PDF URL
  // -----------------------------------------------------

  let finalDocumentUrl = documentUrl || '';

  if (req.file) {
    finalDocumentUrl = `/uploads/documents/${req.file.filename}`;
  }

  // -----------------------------------------------------
  // Create lesson
  // -----------------------------------------------------

  const lesson = await Lesson.create({
    module: moduleId,
    course: moduleDoc.course,

    title: title.trim(),

    description: description || '',

    contentType: selectedContentType,

    videoUrl: videoUrl || '',

    documentType:
      selectedContentType === 'document'
        ? documentType || 'pdf'
        : 'pdf',

    documentUrl: finalDocumentUrl,

    documentText: documentText || '',

    codingQuestion: codingQuestion || '',

    starterCode: starterCode || '',

    duration:
      duration !== undefined
        ? Number(duration)
        : 0,

    order:
      order !== undefined
        ? Number(order)
        : lessonCount,
  });

  await refreshCourseProgress(moduleDoc.course);

  // -----------------------------------------------------
  // Update course statistics
  // -----------------------------------------------------

  await updateCourseStats(moduleDoc.course);

  res.status(201).json({
    success: true,
    data: lesson,
  });
});


// =====================================================
// UPDATE LESSON / CONTENT
// =====================================================

export const updateLesson = asyncHandler(async (req, res) => {
  let lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const {
    title,
    description,
    contentType,
    documentType,
    documentText,
    videoUrl,
    documentUrl,
    codingQuestion,
    starterCode,
    duration,
    order,
  } = req.body;

  // -----------------------------------------------------
  // Normal fields
  // -----------------------------------------------------

  lesson.title = title ?? lesson.title;

  lesson.description =
    description ?? lesson.description;

  lesson.contentType =
    contentType ?? lesson.contentType;

  lesson.videoUrl =
    videoUrl ?? lesson.videoUrl;

  lesson.codingQuestion =
    codingQuestion ?? lesson.codingQuestion;

  lesson.starterCode =
    starterCode ?? lesson.starterCode;

  // -----------------------------------------------------
  // Document fields
  // -----------------------------------------------------

  if (documentType !== undefined) {
    lesson.documentType = documentType;
  }

  if (documentText !== undefined) {
    lesson.documentText = documentText;
  }

  // -----------------------------------------------------
  // PDF / URL
  // -----------------------------------------------------

  if (req.file) {
    lesson.documentUrl =
      `/uploads/documents/${req.file.filename}`;
  } else if (documentUrl !== undefined) {
    lesson.documentUrl = documentUrl;
  }

  // -----------------------------------------------------
  // Other fields
  // -----------------------------------------------------

  if (duration !== undefined) {
    lesson.duration = Number(duration);
  }

  if (order !== undefined) {
    lesson.order = Number(order);
  }

  // -----------------------------------------------------
  // Validation
  // -----------------------------------------------------

  if (
    lesson.contentType === 'video' &&
    !lesson.videoUrl
  ) {
    res.status(400);
    throw new Error(
      'Video URL is required for video content'
    );
  }

  if (lesson.contentType === 'document') {
    const type = lesson.documentType || 'pdf';

    if (
      type === 'pdf' &&
      !lesson.documentUrl
    ) {
      res.status(400);
      throw new Error(
        'PDF document is required'
      );
    }

    if (
      type === 'url' &&
      !lesson.documentUrl
    ) {
      res.status(400);
      throw new Error(
        'Documentation URL is required'
      );
    }

    if (
      type === 'text' &&
      !lesson.documentText?.trim()
    ) {
      res.status(400);
      throw new Error(
        'Document text is required'
      );
    }
  }

  if (
    lesson.contentType === 'coding' &&
    !lesson.codingQuestion
  ) {
    res.status(400);
    throw new Error(
      'Coding question is required'
    );
  }

  // -----------------------------------------------------
  // Save
  // -----------------------------------------------------

  lesson = await lesson.save();

  await updateCourseStats(lesson.course);

  res.json({
    success: true,
    data: lesson,
  });
});


// =====================================================
// DELETE LESSON
// =====================================================

export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const courseId = lesson.course;

  await lesson.deleteOne();

  // Recalculate student progress after deleting lesson
  await refreshCourseProgress(courseId);

  await updateCourseStats(courseId);

  res.json({
    success: true,
    message: 'Lesson deleted successfully',
  });
});


// =====================================================
// GET LESSON BY ID
// =====================================================

export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  res.json({
    success: true,
    data: lesson,
  });
});