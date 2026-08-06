import mongoose, { Schema, model, models } from 'mongoose';

export interface PostSection {
  title: string;
  type: 'text' | 'ordered' | 'unordered' | 'description';
  content: string;
}

export interface IPost {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
  author: string;
  readTime: string;
  content: string;
  html: string;
  sections: PostSection[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    readTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    content: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    },
    sections: {
      type: [{
        title: { type: String, required: true },
        type: { type: String, enum: ['text', 'ordered', 'unordered', 'description'], required: true },
        content: { type: String, required: true },
      }],
      default: [],
    } as unknown as PostSection[],
  },
  { timestamps: true }
);

const Post = models.Post || model<IPost>('Post', postSchema);

export default Post as mongoose.Model<IPost>;
