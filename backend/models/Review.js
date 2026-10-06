import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [3, 'Review must contain at least 3 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },

    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    notHelpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// One student can review a course only once.
reviewSchema.index(
  {
    user: 1,
    course: 1,
  },
  {
    unique: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;