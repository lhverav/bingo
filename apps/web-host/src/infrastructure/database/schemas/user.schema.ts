import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * User document interface for Mongoose
 * This extends Document for Mongoose-specific functionality
 */
export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'host' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for User collection
 * Database-specific concerns (validation, indexes, etc.)
 */
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

// Handle hot reload in development
const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export { UserSchema, UserModel };
