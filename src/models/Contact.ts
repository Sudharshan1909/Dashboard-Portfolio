import mongoose, { Schema, model, models } from 'mongoose';

export interface IContact extends mongoose.Document {
  description: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      default: "Get in touch with me for collaboration opportunities, questions, or just to say hello. I'm always open to discussing new projects and ideas.",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      default: 'hello@example.com',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const Contact = models.Contact || model<IContact>('Contact', contactSchema);

export default Contact as mongoose.Model<IContact>;
