import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';

export interface MobileUserDocument extends Document {
  // Authentication
  email?: string;
  passwordHash?: string;
  phone?: string;
  phoneVerified: boolean;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthProviderId?: string;

  // Profile
  name: string;
  birthdate: string;
  gender: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

  // Preferences
  noAds: boolean;
  shareData: boolean;
  notificationsEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const MobileUserSchema = new Schema<MobileUserDocument>(
  {
    // Authentication fields
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    oauthProvider: {
      type: String,
      enum: ['google', 'facebook', 'apple'],
    },
    oauthProviderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Profile fields
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    birthdate: {
      type: String,
      required: [true, 'Birthdate is required'],
    },
    gender: {
      type: String,
      enum: ['masculino', 'femenino', 'otro', 'prefiero_no_decir'],
      required: [true, 'Gender is required'],
    },

    // Preferences
    noAds: {
      type: Boolean,
      default: false,
    },
    shareData: {
      type: Boolean,
      default: false,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // Metadata
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for OAuth lookup
MobileUserSchema.index(
  { oauthProvider: 1, oauthProviderId: 1 },
  { unique: true, sparse: true }
);

const MobileUserModel: Model<MobileUserDocument> =
  mongoose.models.MobileUser ||
  mongoose.model<MobileUserDocument>('MobileUser', MobileUserSchema);

export { MobileUserSchema, MobileUserModel };
