import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Course description is required'],
    },

    thumbnail: {
      type: String,
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
      default: 0,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    totalLessons: {
      type: Number,
      default: 0,
    },

    totalDuration: {
      type: Number,
      default: 0,
    },

    // ==============================
    // COURSE RATING
    // ==============================

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingDistribution: {
      five: {
        type: Number,
        default: 0,
      },
      four: {
        type: Number,
        default: 0,
      },
      three: {
        type: Number,
        default: 0,
      },
      two: {
        type: Number,
        default: 0,
      },
      one: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

courseSchema.index({
  title: 'text',
  description: 'text',
});

const Course = mongoose.model('Course', courseSchema);

export default Course;