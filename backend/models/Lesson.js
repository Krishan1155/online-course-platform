import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    // video / document / coding
    contentType: {
      type: String,
      enum: ['video', 'document', 'coding'],
      default: 'video',
    },

    // =====================================================
    // VIDEO
    // =====================================================

    videoUrl: {
      type: String,
      default: '',
    },

    // =====================================================
    // DOCUMENT
    // =====================================================

    // pdf / url / text
    documentType: {
      type: String,
      enum: ['pdf', 'url', 'text'],
      default: 'pdf',
    },

    // PDF path or external documentation URL
    documentUrl: {
      type: String,
      default: '',
    },

    // Direct text/notes content
    documentText: {
      type: String,
      default: '',
    },

    // =====================================================
    // CODING
    // =====================================================

    codingQuestion: {
      type: String,
      default: '',
    },

    starterCode: {
      type: String,
      default: '',
    },

    // =====================================================
    // COMMON
    // =====================================================

    duration: {
      type: Number,
      default: 0,
    },

    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({
  course: 1,
  module: 1,
  order: 1,
});

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;