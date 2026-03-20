import mongoose, { Schema, Document } from 'mongoose';

/**
 * Paid round cards subdocument interface
 */
interface PaidRoundCardsDoc {
  roundId: mongoose.Types.ObjectId;
  cardIds: mongoose.Types.ObjectId[];
  purchasedAt: Date;
}

/**
 * GamePlayer document interface
 */
export interface GamePlayerDocument extends Document {
  gameId: mongoose.Types.ObjectId;
  mobileUserId?: mongoose.Types.ObjectId;
  playerCode: string;
  status: 'joined' | 'cards_selected' | 'playing';
  freeCardIds: mongoose.Types.ObjectId[];
  paidRoundCards: PaidRoundCardsDoc[];
  freeCardsLocked: mongoose.Types.ObjectId[];
  freeSelectionDeadline?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paid round cards subdocument schema
 */
const PaidRoundCardsSchema = new Schema({
  roundId: {
    type: Schema.Types.ObjectId,
    ref: 'Round',
    required: true,
  },
  cardIds: [{
    type: Schema.Types.ObjectId,
    ref: 'BunchCard',
  }],
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * GamePlayer schema
 */
const GamePlayerSchema = new Schema<GamePlayerDocument>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    mobileUserId: {
      type: Schema.Types.ObjectId,
      ref: 'MobileUser',
      index: true,
    },
    playerCode: {
      type: String,
      required: true,
      length: 4,
    },
    status: {
      type: String,
      enum: ['joined', 'cards_selected', 'playing'],
      default: 'joined',
    },
    freeCardIds: [{
      type: Schema.Types.ObjectId,
      ref: 'BunchCard',
    }],
    paidRoundCards: [PaidRoundCardsSchema],
    freeCardsLocked: [{
      type: Schema.Types.ObjectId,
      ref: 'BunchCard',
    }],
    freeSelectionDeadline: {
      type: Date,
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

// Compound index for unique player per game (by mobileUserId)
GamePlayerSchema.index(
  { gameId: 1, mobileUserId: 1 },
  { unique: true, sparse: true }
);

// Index for player code lookup within a game
GamePlayerSchema.index({ gameId: 1, playerCode: 1 }, { unique: true });

export const GamePlayerModel = mongoose.models.GamePlayer ||
  mongoose.model<GamePlayerDocument>('GamePlayer', GamePlayerSchema);
