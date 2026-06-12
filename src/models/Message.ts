import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId; // For direct messages
  attachmentIds: mongoose.Types.ObjectId[];
  isDirect: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;
  __v: number;
}

const messageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: false,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    attachmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    isDirect: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indices for efficient queries
messageSchema.index({ courseId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipientId: 1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message;
