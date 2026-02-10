import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface BunchCardDocument extends Document {
  bunchId: Types.ObjectId;
  index: number;
  cells: number[][];
  createdAt: Date;
  updatedAt: Date;
}

const BunchCardSchema = new Schema<BunchCardDocument>(
  {
    bunchId: {
      type: Schema.Types.ObjectId,
      ref: 'CardBunch',
      required: [true, 'El ID del grupo es requerido'],
      index: true,  // Index for fast queries by bunchId
    },
    index: {
      type: Number,
      required: [true, 'El índice de la carta es requerido'],
      min: [0, 'El índice debe ser mayor o igual a 0'],
    },
    cells: {
      type: [[Number]],
      required: [true, 'Las celdas son requeridas'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries: find cards by bunch in order
BunchCardSchema.index({ bunchId: 1, index: 1 });

const BunchCardModel: Model<BunchCardDocument> =
  mongoose.models.BunchCard || mongoose.model<BunchCardDocument>('BunchCard', BunchCardSchema);

export { BunchCardSchema, BunchCardModel };
