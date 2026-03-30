import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface GameDocument extends Document {
  name: string;
  cardType: 'bingo' | 'bingote';
  scheduledAt: Date;
  status: 'scheduled' | 'active' | 'finished' | 'cancelled';
  createdBy: Types.ObjectId;

  // Payment configuration (at game level)
  isPaid: boolean;
  pricePerCard?: number;
  currency?: 'USD' | 'COP';

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

    // Payment configuration
    isPaid: {
      type: Boolean,
      default: false,
    },
    pricePerCard: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    currency: {
      type: String,
      enum: ['USD', 'COP'],
    },
  },
  {
    timestamps: true,
  }
);

// Validate paid game has price and currency
GameSchema.pre('save', function () {
  if (this.isPaid && (!this.pricePerCard || !this.currency)) {
    throw new Error('Los juegos pagos requieren precio y moneda');
  }
});

// Index for efficient queries
GameSchema.index({ status: 1, scheduledAt: 1 });
GameSchema.index({ createdBy: 1 });

const GameModel: Model<GameDocument> =
  mongoose.models.Game || mongoose.model<GameDocument>('Game', GameSchema);

export { GameSchema, GameModel };
