import { Schema, Document, Model, Types } from 'mongoose';
import { mongoose } from '../connection';

export interface PatternDocument extends Document {
  name: string;
  cardType: 'bingo' | 'bingote';
  cells: boolean[][];
  isPreset: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatternSchema = new Schema<PatternDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del patrón es requerido'],
      trim: true,
    },
    cardType: {
      type: String,
      enum: ['bingo', 'bingote'],
      required: [true, 'El tipo de cartón es requerido'],
    },
    cells: {
      type: [[Boolean]],
      required: [true, 'Las celdas del patrón son requeridas'],
    },
    isPreset: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: pattern name should be unique per card type
PatternSchema.index({ name: 1, cardType: 1 }, { unique: true });
PatternSchema.index({ cardType: 1, isPreset: 1 });

const PatternModel: Model<PatternDocument> =
  mongoose.models.Pattern || mongoose.model<PatternDocument>('Pattern', PatternSchema);

export { PatternSchema, PatternModel };
