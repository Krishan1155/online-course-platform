
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
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    contentType: {
      type: String,
      enum: ['video', 'document'],
      default: 'video',
    },


    // S3 object key for newly uploaded videos.
    videoKey: {
      type: String,
      default: '',
    },

    
documentType: {
  type: String,
  enum: ['', 'pdf', 'url', 'text'],
  default: '',
},


    // Retained for existing local PDFs and external document URLs.
    documentUrl: {
      type: String,
      default: '',
    },

    // S3 object key for newly uploaded PDFs.
    documentKey: {
      type: String,
      default: '',
    },

    documentText: {
      type: String,
      default: '',
    },

    // Duration remains in minutes for course statistics.
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
