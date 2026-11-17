import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);

router.get('/users', getAllUsers);

router.put('/users/:id/role', updateUserRole);


export default router;
