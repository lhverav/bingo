import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';

export interface UserDocument extends Document {
  email: string;
  password: string;
  name: string;
  role: 'host' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['host', 'admin'],
      default: 'host',
    },
  },
  {
    timestamps: true,
  }
);

const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export { UserSchema, UserModel };
