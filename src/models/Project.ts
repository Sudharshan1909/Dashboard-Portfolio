import mongoose, { Schema, model, models } from 'mongoose';

export interface IProject {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    href: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      default: '#!',
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const Project = models.Project || model<IProject>('Project', projectSchema);

export default Project as mongoose.Model<IProject>;
