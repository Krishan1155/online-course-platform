import mongoose from 'mongoose';

const paymentRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentEmail: {
      type: String,
      required: [true, 'Student email is required'],
      trim: true,
      lowercase: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    coursePrice: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Course price cannot be negative'],
    },
    paymentScreenshot: {
      type: String,
      required: [true, 'Payment screenshot is required'],
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

paymentRequestSchema.index({ student: 1, course: 1, paymentStatus: 1 });
paymentRequestSchema.index({ paymentStatus: 1, createdAt: -1 });

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);  

export default PaymentRequest;
