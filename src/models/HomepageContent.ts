import mongoose, { Schema, model, models } from 'mongoose';

export interface IHomepageContent {
  _id: mongoose.Types.ObjectId;
  greeting: string;
  description: string;
  updatedAt: Date;
}

const homepageContentSchema = new Schema<IHomepageContent>(
  {
    greeting: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "Hello, I'm Your Name",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
      default: "A passionate frontend developer with a keen eye for design and a love for creating beautiful, functional web experiences.",
    },
  },
  { timestamps: true }
);

const HomepageContent = models.HomepageContent || model<IHomepageContent>('HomepageContent', homepageContentSchema);

export default HomepageContent as mongoose.Model<IHomepageContent>;
