import express from 'express';
import {
  getPaymentConfig,
  submitPaymentRequest,
  getMyPaymentRequests,
  getPaymentStatusForCourse,
  getPaymentRequestById,
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from '../controllers/paymentRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadPaymentScreenshot } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);

router.post(
  '/',
  protect,
  uploadPaymentScreenshot.single('paymentScreenshot'),
  submitPaymentRequest
);

router.get('/my', protect, getMyPaymentRequests);
router.get('/status/:courseId', protect, getPaymentStatusForCourse);

router.get('/admin/all', protect, authorize('admin'), getAllPaymentRequests);
router.put('/admin/:id/approve', protect, authorize('admin'), approvePaymentRequest);
router.put('/admin/:id/reject', protect, authorize('admin'), rejectPaymentRequest);

router.get('/:id', protect, getPaymentRequestById);

export default router;
