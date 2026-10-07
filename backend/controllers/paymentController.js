import crypto from 'crypto';
import Razorpay from 'razorpay';
import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createOrder = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.price <= 0) {
    res.status(400);
    throw new Error('This course is free. Use direct enrollment.');
  }

  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  const razorpay = getRazorpayInstance();
  const amountInPaise = Math.round(course.price * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `course_${courseId}_${Date.now()}`,
    notes: {
      courseId: courseId.toString(),
      userId: req.user._id.toString(),
    },
  });

  const payment = await Payment.create({
    user: req.user._id,
    course: courseId,
    amount: course.price,
    razorpayOrderId: order.id,
    status: 'created',
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      courseTitle: course.title,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    paymentId,
  } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  const payment = await Payment.findById(paymentId);

if (!payment) {
  res.status(404);
  throw new Error('Payment record not found');
}

if (payment.razorpayOrderId !== razorpay_order_id) {
  res.status(400);
  throw new Error('Order ID mismatch');
}

if (payment.status === 'paid') {
  res.status(400);
  throw new Error('Payment has already been verified');
}

payment.razorpayPaymentId = razorpay_payment_id;
payment.razorpaySignature = razorpay_signature;
payment.status = 'paid';

await payment.save();

  const existingEnrollment = await Enrollment.findOne({
    user: payment.user,
    course: payment.course,
  });

  if (!existingEnrollment) {
    const enrollment = await Enrollment.create({
      user: payment.user,
      course: payment.course,
      payment: payment._id,
    });

    await Progress.create({
      user: payment.user,
      course: payment.course,
      completedLessons: [],
      progressPercentage: 0,
    });

    res.json({
      success: true,
      message: 'Payment verified and enrollment successful',
      data: { payment, enrollment },
    });
    return;
  }

  res.json({
    success: true,
    message: 'Payment verified',
    data: { payment, enrollment: existingEnrollment },
  });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ status: 'paid' })
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});

export const getRevenueStats = asyncHandler(async (req, res) => {
  const paidPayments = await Payment.find({ status: 'paid' });

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = paidPayments.length;

  const enrollments = await Enrollment.countDocuments();
  const users = await (await import('../models/User.js')).default.countDocuments();
  const courses = await Course.countDocuments();

  const monthlyRevenue = await Payment.aggregate([
    { $match: { status: 'paid' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);

  //  Get latest 10 payments
  const recentPayments = await Payment.find({
    status: 'paid'
  })
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalTransactions,
      totalEnrollments: enrollments,
      totalUsers: users,
      totalCourses: courses,
      monthlyRevenue,
      recentPayments
    },
  });
});
