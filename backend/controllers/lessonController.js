
import asyncHandler from 'express-async-handler';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import ffprobeStatic from 'ffprobe-static';

import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Progress from '../models/Progress.js';
import { updateCourseStats } from './courseController.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3.js';

const execFileAsync = promisify(execFile);

const BUCKET_PREFIX = 'courses';

const getUploadedFile = (req, fieldName) =>
  req.files?.[fieldName]?.[0] || null;

const cleanupTempFiles = async (files = []) => {
  await Promise.all(
    files.filter(Boolean).map(async (file) => {
      try {
        await unlink(file.path);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Temporary file cleanup failed:', error.message);
        }
      }
    })
  );
};

const getVideoDurationMinutes = async (filePath) => {
  if (!ffprobeStatic?.path) {
    throw new Error('FFprobe is unavailable. Check the ffprobe-static installation.');
  }

  const { stdout } = await execFileAsync(
    ffprobeStatic.path,
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { timeout: 60000 }
  );

  const seconds = Number(stdout.trim());

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('Could not extract the uploaded video duration.');
  }

  // Store minutes to match the existing Lesson.duration field.
  return Math.round((seconds / 60) * 10) / 10;
};

const makeS3Key = (courseId, moduleId, file, type) => {
  const extension = path.extname(file.originalname).toLowerCase();

  return `${BUCKET_PREFIX}/${courseId}/modules/${moduleId}/${type}/${randomUUID()}${extension}`;
};

const refreshCourseProgress = async (courseId) => {
  const lessons = await Lesson.find({
    course: courseId,
  }).select('_id');

  const lessonIds = new Set(
    lessons.map((lesson) => lesson._id.toString())
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
              (progress.completedLessons.length / lessons.length) * 100
            )
          : 0;

      await progress.save();
    })
  );
};

// Delete old objects after the database update succeeds.
// A deletion failure is logged instead of undoing a successful lesson update.
const deleteOldS3Objects = async (keys = []) => {
  for (const key of new Set(keys.filter(Boolean))) {
    try {
      await deleteFromS3(key);
    } catch (error) {
      console.error(`Could not delete old S3 object "${key}":`, error.message);
    }
  }
};

// =====================================================
// CREATE LESSON
// =====================================================


export const createLesson = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  const videoFile = getUploadedFile(req, 'video');
  const documentFile = getUploadedFile(req, 'document');
  const tempFiles = [videoFile, documentFile];
  const uploadedKeys = [];

  try {
    const {
      title,
      description,
      contentType,
      documentType,
      documentText,
      documentUrl,
    } = req.body;

    const moduleDoc = await Module.findById(moduleId);

    if (!moduleDoc) {
      res.status(404);
      throw new Error('Module not found');
    }

    if (!title?.trim()) {
      res.status(400);
      throw new Error('Lesson title is required');
    }

    if (videoFile && documentFile) {
      res.status(400);
      throw new Error('Upload either a video or a document, not both.');
    }

    const selectedContentType = contentType || 'video';

    if (!['video', 'document'].includes(selectedContentType)) {
      res.status(400);
      throw new Error('Invalid lesson content type.');
    }

    const selectedDocumentType =
      selectedContentType === 'document'
        ? documentType || 'pdf'
        : '';

    let videoKey = '';
    let documentKey = '';
    let finalDocumentUrl = documentUrl?.trim() || '';
    let finalDocumentText = '';
    let duration = 0;

    if (selectedContentType === 'video') {
      if (!videoFile) {
        res.status(400);
        throw new Error('Please upload a video file.');
      }

      if (documentFile) {
        res.status(400);
        throw new Error('A video lesson cannot contain a document.');
      }

      duration = await getVideoDurationMinutes(videoFile.path);

      videoKey = makeS3Key(
        moduleDoc.course,
        moduleId,
        videoFile,
        'videos'
      );

      await uploadToS3({
        filePath: videoFile.path,
        key: videoKey,
        contentType: videoFile.mimetype,
      });

      uploadedKeys.push(videoKey);
    } else {
      if (videoFile) {
        res.status(400);
        throw new Error('A document lesson cannot contain a video.');
      }

      if (!['pdf', 'url', 'text'].includes(selectedDocumentType)) {
        res.status(400);
        throw new Error('Invalid document type.');
      }

      if (selectedDocumentType === 'pdf') {
        if (!documentFile) {
          res.status(400);
          throw new Error('Please upload a PDF document.');
        }

        documentKey = makeS3Key(
          moduleDoc.course,
          moduleId,
          documentFile,
          'documents'
        );

        await uploadToS3({
          filePath: documentFile.path,
          key: documentKey,
          contentType: 'application/pdf',
        });

        uploadedKeys.push(documentKey);
        finalDocumentUrl = '';
      }

      if (selectedDocumentType === 'url' && !finalDocumentUrl) {
        res.status(400);
        throw new Error('Documentation URL is required.');
      }

      if (selectedDocumentType === 'text') {
        if (!documentText?.trim()) {
          res.status(400);
          throw new Error('Document text is required.');
        }

        finalDocumentText = documentText.trim();
      }
    }

    const lessonCount = await Lesson.countDocuments({
      module: moduleId,
    });

    const lesson = await Lesson.create({
      module: moduleId,
      course: moduleDoc.course,
      title: title.trim(),
      description: description || '',
      contentType: selectedContentType,
      videoKey,
      documentType: selectedDocumentType,
      documentUrl: finalDocumentUrl,
      documentKey,
      documentText: finalDocumentText,
      duration,
      order: lessonCount + 1,
    });

    await refreshCourseProgress(moduleDoc.course);
    await updateCourseStats(moduleDoc.course);

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    await deleteOldS3Objects(uploadedKeys);
    throw error;
  } finally {
    await cleanupTempFiles(tempFiles);
  }
});


// =====================================================
// UPDATE LESSON
// =====================================================

export const updateLesson = asyncHandler(async (req, res) => {
  let lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const videoFile = getUploadedFile(req, 'video');
  const documentFile = getUploadedFile(req, 'document');
  const tempFiles = [videoFile, documentFile];

  let newlyUploadedKeys = [];
  let oldKeysToDelete = [];

  try {
    const {
  title,
  description,
  contentType,
  documentType,
  documentText,
  documentUrl,
  duration,
  order,
} = req.body;

    if (videoFile && documentFile) {
      res.status(400);
      throw new Error('Upload either a video or a PDF, not both.');
    }

    const nextContentType = contentType ?? lesson.contentType;

    const nextDocumentType =
  nextContentType === 'document'
    ? documentType || (
        lesson.contentType === 'document'
          ? lesson.documentType
          : 'pdf'
      )
    : '';

    if (!['video', 'document'].includes(nextContentType)) {
      res.status(400);
      throw new Error('Invalid lesson content type.');
    }

    if (
      nextContentType === 'document' &&
      !['pdf', 'url', 'text'].includes(nextDocumentType)
    ) {
      res.status(400);
      throw new Error('Invalid document type.');
    }

    // -------------------------------------------------
    // VALIDATE DURATION
    // -------------------------------------------------

    let parsedDuration;

    if (duration !== undefined) {
      parsedDuration = Number(duration);

      if (
        duration === '' ||
        !Number.isFinite(parsedDuration) ||
        parsedDuration < 0
      ) {
        res.status(400);
        throw new Error(
          'Duration must be a valid non-negative number.'
        );
      }
    }

    // -------------------------------------------------
    // BASIC FIELDS
    // -------------------------------------------------

    if (title !== undefined) {
      if (!title.trim()) {
        res.status(400);
        throw new Error('Lesson title is required.');
      }

      lesson.title = title.trim();
    }

    if (description !== undefined) {
      lesson.description = description;
    }

    

    if (documentText !== undefined) {
      lesson.documentText = documentText;
    }

    if (order !== undefined) {
      const parsedOrder = Number(order);

      if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
        res.status(400);
        throw new Error('Order must be a positive integer.');
      }

      lesson.order = parsedOrder;
    }

    // -------------------------------------------------
    // VIDEO
    // -------------------------------------------------

    
if (nextContentType === 'video') {
  if (documentFile) {
    res.status(400);
    throw new Error(
      'A video lesson cannot contain a document upload.'
    );
  }

  // Clear document fields for a video lesson.
  if (lesson.documentKey) {
    oldKeysToDelete.push(lesson.documentKey);
  }

  lesson.documentType = '';
  lesson.documentKey = '';
  lesson.documentUrl = '';
  lesson.documentText = '';

  if (videoFile) {
    const extractedDuration =
      await getVideoDurationMinutes(videoFile.path);

    const newVideoKey = makeS3Key(
      lesson.course,
      lesson.module,
      videoFile,
      'videos'
    );

    await uploadToS3({
      filePath: videoFile.path,
      key: newVideoKey,
      contentType: videoFile.mimetype,
    });

    newlyUploadedKeys.push(newVideoKey);

    if (lesson.videoKey) {
      oldKeysToDelete.push(lesson.videoKey);
    }

    lesson.videoKey = newVideoKey;
    lesson.duration = extractedDuration;
  } else if (
    lesson.contentType !== 'video' ||
    !lesson.videoKey
  ) {
    res.status(400);
    throw new Error('Please upload a video file.');
  } else if (parsedDuration !== undefined) {
    // Keep the existing S3 video and update its duration.
    lesson.duration = parsedDuration;
  }
}


    // -------------------------------------------------
    // DOCUMENT
    // -------------------------------------------------

    if (nextContentType === 'document') {
      if (videoFile) {
        res.status(400);
        throw new Error(
          'A document lesson cannot contain a video upload.'
        );
      }

     // Remove the old video only when switching from video to document.
if (lesson.contentType === 'video' && lesson.videoKey) {
  oldKeysToDelete.push(lesson.videoKey);
}

lesson.videoKey = '';

      lesson.documentType = nextDocumentType;

      // Save estimated reading duration for documents.
      if (parsedDuration !== undefined) {
        lesson.duration = parsedDuration;
      }

      // PDF
      if (nextDocumentType === 'pdf') {
        if (documentFile) {
          const newDocumentKey = makeS3Key(
            lesson.course,
            lesson.module,
            documentFile,
            'documents'
          );

          await uploadToS3({
            filePath: documentFile.path,
            key: newDocumentKey,
            contentType: 'application/pdf',
          });

          newlyUploadedKeys.push(newDocumentKey);

          if (lesson.documentKey) {
            oldKeysToDelete.push(lesson.documentKey);
          }

          lesson.documentKey = newDocumentKey;
          lesson.documentUrl = '';
        } else if (documentUrl !== undefined) {
          if (!documentUrl.trim()) {
            res.status(400);
            throw new Error('PDF URL cannot be empty.');
          }

          if (lesson.documentKey) {
            oldKeysToDelete.push(lesson.documentKey);
          }

          lesson.documentKey = '';
          lesson.documentUrl = documentUrl.trim();
        } else if (!lesson.documentKey && !lesson.documentUrl) {
          res.status(400);
          throw new Error('Please upload a PDF document.');
        }
      }

      // WEB URL
      if (nextDocumentType === 'url') {
        const nextUrl = documentUrl ?? lesson.documentUrl;

        if (!nextUrl?.trim()) {
          res.status(400);
          throw new Error('Documentation URL is required.');
        }

        if (lesson.documentKey) {
          oldKeysToDelete.push(lesson.documentKey);
        }

        lesson.documentKey = '';
        lesson.documentUrl = nextUrl.trim();
      }

      // TEXT
      if (nextDocumentType === 'text') {
        if (!lesson.documentText?.trim()) {
          res.status(400);
          throw new Error('Document text is required.');
        }

        if (lesson.documentKey) {
          oldKeysToDelete.push(lesson.documentKey);
        }

        lesson.documentKey = '';
        lesson.documentUrl = '';
      }
    }

    // -------------------------------------------------
    // SAVE AND UPDATE COURSE STATISTICS
    // -------------------------------------------------

    lesson.contentType = nextContentType;

    lesson = await lesson.save();

    await updateCourseStats(lesson.course);

    await deleteOldS3Objects(oldKeysToDelete);

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    // Remove newly uploaded S3 objects if the update fails.
    await deleteOldS3Objects(newlyUploadedKeys);

    throw error;
  } finally {
    await cleanupTempFiles(tempFiles);
  }
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
  const oldKeys = [lesson.videoKey, lesson.documentKey];

  await lesson.deleteOne();

  await refreshCourseProgress(courseId);
  await updateCourseStats(courseId);
  await deleteOldS3Objects(oldKeys);

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
