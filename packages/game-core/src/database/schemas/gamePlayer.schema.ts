import mongoose, { Schema, Document } from 'mongoose';

/**
 * GamePlayer document interface
 * Represents a player who has joined a game
 *
 * Card flow:
 * - Player joins game and gets/buys cards (depending on isPaid at game level)
 * - Player can CHANGE cards before each round starts (always free)
 * - Once a round starts, cards are locked until round ends
 */
export interface GamePlayerDocument extends Document {
  gameId: mongoose.Types.ObjectId;
  mobileUserId?: mongoose.Types.ObjectId;
  playerCode: string;
  status: 'joined' | 'cards_selected' | 'playing';

  // Current cards (can be changed before each round)
  cardIds: mongoose.Types.ObjectId[];

  // Payment tracking (for paid games)
  hasPaid: boolean;
  paidAt?: Date;

  // Card selection tracking
  cardsLocked: boolean;
  selectionDeadline?: Date;

  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

    // Current cards
    cardIds: [{
      type: Schema.Types.ObjectId,
      ref: 'BunchCard',
    }],

    // Payment tracking
    hasPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },

    // Card selection tracking
    cardsLocked: {
      type: Boolean,
      default: false,
    },
    selectionDeadline: {
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
