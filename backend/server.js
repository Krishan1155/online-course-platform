import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB from './config/db.js';

import {
  notFound,
  errorHandler,
} from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config();

// =====================================================
// PATHS
// =====================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const uploadsDir =
  path.join(__dirname, 'uploads');

const paymentsUploadDir =
  path.join(
    uploadsDir,
    'payments'
  );

const documentsUploadDir =
  path.join(
    uploadsDir,
    'documents'
  );

// =====================================================
// CREATE UPLOAD DIRECTORIES
// =====================================================

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(
    uploadsDir,
    {
      recursive: true,
    }
  );
}

if (!fs.existsSync(paymentsUploadDir)) {
  fs.mkdirSync(
    paymentsUploadDir,
    {
      recursive: true,
    }
  );
}

if (!fs.existsSync(documentsUploadDir)) {
  fs.mkdirSync(
    documentsUploadDir,
    {
      recursive: true,
    }
  );
}

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// EXPRESS
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:5173',

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
  '/uploads',
  express.static(uploadsDir)
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      success: true,
      message:
        'Course Platform API is running',
    });
  }
);

// =====================================================
// ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/courses',
  courseRoutes
);

app.use(
  '/api/modules',
  moduleRoutes
);

app.use(
  '/api/lessons',
  lessonRoutes
);

app.use(
  '/api/enrollments',
  enrollmentRoutes
);

app.use(
  '/api/progress',
  progressRoutes
);

app.use(
  '/api/payments',
  paymentRoutes
);

app.use(
  '/api/admin',
  adminRoutes
);

// COURSE REVIEWS
app.use(
  '/api/reviews',
  reviewRoutes
);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use(notFound);

app.use(errorHandler);

// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 5001;

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `Server running on port ${PORT}`
      );
    }
  );

server.on(
  'error',
  (error) => {
    if (
      error.code ===
      'EADDRINUSE'
    ) {
      console.error(
        `Port ${PORT} is already in use. Change PORT in backend/.env or stop the process using that port.`
      );

      process.exit(1);
    }

    throw error;
  }
);

export default app;