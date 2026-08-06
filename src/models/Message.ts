import mongoose, { Schema, model, models } from 'mongoose';

export interface IMessage extends mongoose.Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Message = models.Message || model<IMessage>('Message', messageSchema);

export default Message as mongoose.Model<IMessage>;
