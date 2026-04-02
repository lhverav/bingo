import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';
import { CardType } from '@bingo/domain';

export interface CardBunchDocument extends Document {
  name: string;
  cardType: CardType;   // 'bingo' or 'bingote'
  cardCount: number;    // Count of cards in BunchCard collection
  createdAt: Date;
  updatedAt: Date;
}

const CardBunchSchema = new Schema<CardBunchDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del grupo de cartas es requerido'],
      trim: true,
      unique: true,
    },
    cardType: {
      type: String,
      required: [true, 'El tipo de carta es requerido'],
      enum: {
        values: ['bingo', 'bingote'],
        message: 'El tipo de carta debe ser "bingo" o "bingote"',
      },
    },
    cardCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El conteo de cartas no puede ser negativo'],
    },
  },
  {
    timestamps: true,
  }
);

const CardBunchModel: Model<CardBunchDocument> =
  mongoose.models.CardBunch || mongoose.model<CardBunchDocument>('CardBunch', CardBunchSchema);

export { CardBunchSchema, CardBunchModel };
