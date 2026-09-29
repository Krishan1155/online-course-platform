import asyncHandler from 'express-async-handler';
import PaymentRequest from '../models/PaymentRequest.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import { MANUAL_PAYMENT_CONFIG } from '../config/paymentConfig.js';

export const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      upiId: MANUAL_PAYMENT_CONFIG.upiId,
      qrCodePath: MANUAL_PAYMENT_CONFIG.qrCodePath,
    },
  });
});

export const submitPaymentRequest = asyncHandler(async (req, res) => {
  const { courseId, studentName, studentEmail, transactionId } = req.body;

  if (!courseId || !studentName || !studentEmail) {
    res.status(400);
    throw new Error('Course ID, student name, and email are required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Payment screenshot is required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.price <= 0) {
    res.status(400);
    throw new Error('This course is free. Use direct enrollment.');
  }

  const existingEnrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (existingEnrollment) {
    res.status(400);
    throw new Error('You are already enrolled in this course');
  }

  const pendingRequest = await PaymentRequest.findOne({
    student: req.user._id,
    course: courseId,
    paymentStatus: 'pending',
  });

  if (pendingRequest) {
    res.status(400);
    throw new Error('You already have a pending payment request for this course');
  }

  const paymentRequest = await PaymentRequest.create({
    student: req.user._id,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim().toLowerCase(),
    course: courseId,
    courseName: course.title,
    coursePrice: course.price,
    paymentScreenshot: `/uploads/payments/${req.file.filename}`,
    transactionId: transactionId?.trim() || '',
    paymentStatus: 'pending',
    paymentDate: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Your payment request has been submitted successfully. Please wait until admin verifies your payment.',
    data: paymentRequest,
  });
});

export const getMyPaymentRequests = asyncHandler(async (req, res) => {
  const requests = await PaymentRequest.find({ student: req.user._id })
    .populate('course', 'title thumbnail price')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, data: requests });
});

export const getPaymentStatusForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const latestRequest = await PaymentRequest.findOne({
    student: req.user._id,
    course: courseId,
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      hasRequest: !!latestRequest,
      paymentStatus: latestRequest?.paymentStatus || null,
      paymentRequest: latestRequest,
    },
  });
});

export const getPaymentRequestById = asyncHandler(async (req, res) => {
  const paymentRequest = await PaymentRequest.findById(req.params.id)
    .populate('student', 'name email')
    .populate('course', 'title price thumbnail')
    .populate('reviewedBy', 'name email');

  if (!paymentRequest) {
    res.status(404);
    throw new Error('Payment request not found');
  }

  const isOwner = paymentRequest.student._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this payment request');
  }

  res.json({ success: true, data: paymentRequest });
});

export const getAllPaymentRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.paymentStatus = status;
  }

  const requests = await PaymentRequest.find(filter)
    .populate('student', 'name email')
    .populate('course', 'title price')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, data: requests });
});

export const approvePaymentRequest = asyncHandler(async (req, res) => {
  const paymentRequest = await PaymentRequest.findById(req.params.id);

  if (!paymentRequest) {
    res.status(404);
    throw new Error('Payment request not found');
  }

  if (paymentRequest.paymentStatus === 'approved') {
    res.status(400);
    throw new Error('Payment request is already approved');
  }

  if (paymentRequest.paymentStatus === 'rejected') {
    res.status(400);
    throw new Error('Cannot approve a rejected payment request. Student must submit a new request.');
  }

  const existingEnrollment = await Enrollment.findOne({
    user: paymentRequest.student,
    course: paymentRequest.course,
  });

  if (!existingEnrollment) {
    await Enrollment.create({
      user: paymentRequest.student,
      course: paymentRequest.course,
    });

    await Progress.create({
      user: paymentRequest.student,
      course: paymentRequest.course,
      completedLessons: [],
      progressPercentage: 0,
    });
  }

  paymentRequest.paymentStatus = 'approved';
  paymentRequest.reviewedAt = new Date();
  paymentRequest.reviewedBy = req.user._id;
  await paymentRequest.save();

  res.json({
    success: true,
    message: 'Payment approved and student enrolled successfully',
    data: paymentRequest,
  });
});

export const rejectPaymentRequest = asyncHandler(async (req, res) => {
  const paymentRequest = await PaymentRequest.findById(req.params.id);

  if (!paymentRequest) {
    res.status(404);
    throw new Error('Payment request not found');
  }

  if (paymentRequest.paymentStatus === 'approved') {
    res.status(400);
    throw new Error('Cannot reject an approved payment request');
  }

  if (paymentRequest.paymentStatus === 'rejected') {
    res.status(400);
    throw new Error('Payment request is already rejected');
  }

  paymentRequest.paymentStatus = 'rejected';
  paymentRequest.reviewedAt = new Date();
  paymentRequest.reviewedBy = req.user._id;
  await paymentRequest.save();

  res.json({
    success: true,
    message: 'Payment request rejected',
    data: paymentRequest,
  });
});
