import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getAllPayments,
  getRevenueStats,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/admin/all', protect, authorize('admin'), getAllPayments);
router.get('/admin/revenue', protect, authorize('admin'), getRevenueStats);

export default router;
