import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  courseCode: string;
  courseName: string;
  description: string;
  department: string;
  term: string;
  instructor: mongoose.Types.ObjectId;
  classReps: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  capacity: number;
  enrollmentCount: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const courseSchema = new Schema<ICourse>(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    term: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    classReps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    capacity: {
      type: Number,
      required: true,
      default: 500,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
courseSchema.index({ department: 1, term: 1 });

const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

export default Course;
