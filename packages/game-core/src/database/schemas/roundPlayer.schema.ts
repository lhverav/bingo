import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface RoundPlayerDocument extends Document {
  roundId: Types.ObjectId;
  playerCode: string;
  status: 'selecting' | 'ready';
  lockedCardIds: Types.ObjectId[];
  selectedCardIds: Types.ObjectId[];
  selectionDeadline: Date;
  joinedAt: Date;
}

const RoundPlayerSchema = new Schema<RoundPlayerDocument>(
  {
    roundId: {
      type: Schema.Types.ObjectId,
      ref: 'Round',
      required: [true, 'El ID de la ronda es requerido'],
      index: true,
    },
    playerCode: {
      type: String,
      required: [true, 'El codigo del jugador es requerido'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['selecting', 'ready'],
      default: 'selecting',
    },
    lockedCardIds: {
      type: [Schema.Types.ObjectId],
      ref: 'BunchCard',
      default: [],
    },
    selectedCardIds: {
      type: [Schema.Types.ObjectId],
      ref: 'BunchCard',
      default: [],
    },
    selectionDeadline: {
      type: Date,
      required: [true, 'La fecha limite de seleccion es requerida'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: playerCode must be unique within a round
RoundPlayerSchema.index({ roundId: 1, playerCode: 1 }, { unique: true });

const RoundPlayerModel: Model<RoundPlayerDocument> =
  mongoose.models.RoundPlayer || mongoose.model<RoundPlayerDocument>('RoundPlayer', RoundPlayerSchema);

export { RoundPlayerSchema, RoundPlayerModel };
