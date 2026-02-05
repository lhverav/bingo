import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';

export interface CardBunchDocument extends Document {
  name: string;
  cardSize: number;
  maxNumber: number;
  cards: number[][][];
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
    cardSize: {
      type: Number,
      required: [true, 'El tamaño de la carta es requerido'],
      min: [3, 'El tamaño mínimo es 3'],
      max: [10, 'El tamaño máximo es 10'],
    },
    maxNumber: {
      type: Number,
      required: [true, 'El número máximo es requerido'],
      min: [1, 'El número máximo debe ser al menos 1'],
    },
    cards: {
      type: [[[Number]]],
      required: [true, 'Las cartas son requeridas'],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const CardBunchModel: Model<CardBunchDocument> =
  mongoose.models.CardBunch || mongoose.model<CardBunchDocument>('CardBunch', CardBunchSchema);

export { CardBunchSchema, CardBunchModel };
