import mongoose, { Schema, model, models } from 'mongoose';

export interface ExperienceItem {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  role: string;
  company: string;
  description: string;
}

export interface CareerItem {
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  degree: string;
  course: string;
  college: string;
  cgpa: string;
}

export interface IAbout extends mongoose.Document {
  title: string;
  description: string;
  image: string;
  thumbnailImage: string;
  skills: string[];
  experience: {
    title: string;
    items: ExperienceItem[];
  };
  career: {
    title: string;
    items: CareerItem[];
  };
  updatedAt: Date;
}

const experienceItemSchema = {
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  role: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
};

const careerItemSchema = {
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  degree: { type: String, required: true },
  course: { type: String, default: '' },
  college: { type: String, required: true },
  cgpa: { type: String, required: true },
};

const aboutSchema = new Schema<IAbout>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'About Me',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      default:
        'This is where you can introduce yourself or your company. Share your story, mission, and values.',
    },
    image: {
      type: String,
      default: '/assets/images/about.jpg',
    },
    thumbnailImage: {
      type: String,
      default: '/assets/images/about/coder.jpg',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: new Schema(
        {
          title: { type: String, default: 'Experience' },
          items: [experienceItemSchema],
        },
        { _id: false }
      ),
      default: () => ({ title: 'Experience', items: [] }),
    },
    career: {
      type: new Schema(
        {
          title: { type: String, default: 'Career' },
          items: [careerItemSchema],
        },
        { _id: false }
      ),
      default: () => ({ title: 'Career', items: [] }),
    },
  },
  { timestamps: true }
);

const About = models.About || model<IAbout>('About', aboutSchema);

export default About as mongoose.Model<IAbout>;
