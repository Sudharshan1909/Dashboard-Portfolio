import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  provider: 'credentials' | 'google';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Absent for Google accounts, which have no password of ours to check.
    // select: false so it is never returned unless explicitly asked for.
    passwordHash: {
      type: String,
      select: false,
    },
    image: String,
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      required: true,
      default: 'credentials',
    },
    googleId: String,
  },
  { timestamps: true }
);

// models is repopulated on HMR; reuse the compiled model instead of recompiling.
const User = models.User || model<IUser>('User', userSchema);

export default User as mongoose.Model<IUser>;
