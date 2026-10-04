import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// COMMON PATH
// =====================================================

const uploadsDir = path.join(
  __dirname,
  '../uploads'
);

// =====================================================
// THUMBNAIL UPLOAD
// =====================================================

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(
      null,
      `thumbnail-${uniqueSuffix}${path.extname(
        file.originalname
      )}`
    );
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;

  const ext = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only image files are allowed'
      ),
      false
    );
  }
};

export const uploadThumbnail = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFileFilter,
});



// =====================================================
// DOCUMENT / PDF UPLOAD
// =====================================================

const documentStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(
      null,
      path.join(
        uploadsDir,
        'documents'
      )
    );
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(
      null,
      `document-${uniqueSuffix}${path.extname(
        file.originalname
      ).toLowerCase()}`
    );
  },
});

// PDF ONLY
const documentFileFilter = (
  req,
  file,
  cb
) => {
  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();

  if (
    extension === '.pdf' &&
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only PDF documents are allowed'
      ),
      false
    );
  }
};

export const uploadDocument = multer({
  storage: documentStorage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: documentFileFilter,
});