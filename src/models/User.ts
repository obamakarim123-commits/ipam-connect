import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  studentId: string;
  department: string;
  academicYear: number;
  profileImage?: string;
  privacy: {
    showEmail: boolean;
    showDepartment: boolean;
    showYear: boolean;
  };
  storageUsed: number; // in bytes
  storageLimit: number; // 500 MB default
  role: 'student' | 'class-rep' | 'admin';
  enrolledCourses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  onboardingComplete: boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: false,
    },
    studentId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    department: {
      type: String,
      required: false,
    },
    academicYear: {
      type: Number,
      required: false,
    },
    profileImage: {
      type: String,
      required: false,
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false,
      },
      showDepartment: {
        type: Boolean,
        default: true,
      },
      showYear: {
        type: Boolean,
        default: true,
      },
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
    storageLimit: {
      type: Number,
      default: 500 * 1024 * 1024, // 500 MB
    },
    role: {
      type: String,
      enum: ['student', 'class-rep', 'admin'],
      default: 'student',
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
