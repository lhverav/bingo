import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface GameDocument extends Document {
  name: string;
  cardType: 'bingo' | 'bingote';
  scheduledAt: Date;
  status: 'scheduled' | 'active' | 'finished' | 'cancelled';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<GameDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del juego es requerido'],
      trim: true,
    },
    cardType: {
      type: String,
      enum: ['bingo', 'bingote'],
      required: [true, 'El tipo de cartón es requerido'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'La fecha programada es requerida'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'finished', 'cancelled'],
      default: 'scheduled',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
GameSchema.index({ status: 1, scheduledAt: 1 });
GameSchema.index({ createdBy: 1 });

const GameModel: Model<GameDocument> =
  mongoose.models.Game || mongoose.model<GameDocument>('Game', GameSchema);

export { GameSchema, GameModel };
