import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  fileName: string;
  s3Key: string;
  s3Bucket: string;
  mimeType: string;
  fileSize: number; // in bytes
  uploadedBy: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  uploadedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;
  __v: number;
}

const fileSchema = new Schema<IFile>(
  {
    fileName: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    s3Bucket: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient course-based queries
fileSchema.index({ courseId: 1, uploadedAt: -1 });
fileSchema.index({ uploadedBy: 1, uploadedAt: -1 });

const File = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);

export default File;
