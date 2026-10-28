
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(uploadsDir, 'documents');
const lessonTempDir = path.join(uploadsDir, 'lesson-temp');

// Ensure upload directories exist.
for (const directory of [
  uploadsDir,
  documentsDir,
  lessonTempDir,
]) {
  mkdirSync(directory, { recursive: true });
}

// ---> Existing thumbnail upload: stored locally.
const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `thumbnail-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const imageFilter = (_req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedTypes.includes(file.mimetype)) 
  {
    return cb(null, true);
  }

  cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed.'));
};

export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

//---> Existing document upload: stored locally for backward compatibility.
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, documentsDir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `document-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`);
  },
});

const pdfFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if(file.mimetype === 'application/pdf' && extension === '.pdf') 
  {
    return cb(null, true);
  }

  cb(new Error('Only PDF files are allowed.'));
};

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ----> New lesson-media uploads: temporary disk storage before S3 upload.

// Video field: "video"
// PDF field: "document"
const lessonMediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, lessonTempDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(
      null,
      `lesson-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
    );
  },
});

const videoExtensions = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
]);

const videoMimeTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

const lessonMediaFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'video') 
  {
    if(videoExtensions.has(extension) && videoMimeTypes.has(file.mimetype)) 
    {
      return cb(null, true);
    }

    return cb(new Error('Use a supported MP4, WebM, MOV, or M4V video file.'));
  }

  if (file.fieldname === 'document') 
  {
    if (extension === '.pdf' && file.mimetype === 'application/pdf') 
    {
      return cb(null, true);
    }
    return cb(new Error('Only PDF files are allowed.'));
  }
  cb(new Error('Unexpected lesson-media field.'));
};

export const uploadLessonMedia = multer({
  storage: lessonMediaStorage,
  fileFilter: lessonMediaFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // Maximum 1 GB per file
    files: 2,
  },
});
