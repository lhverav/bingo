import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';

export interface GeneralParametersDocument extends Document {
  selectionTimeSeconds: number;
  freeCardsDelivered: number;
  freeCardsToSelect: number;
  maxCardsToBuy: number;
  paidCardsToIssue: number;
  updatedAt: Date;
}

const GeneralParametersSchema = new Schema<GeneralParametersDocument>(
  {
    selectionTimeSeconds: {
      type: Number,
      required: true,
      min: [10, 'El tiempo mínimo de selección es 10 segundos'],
      default: 60,
    },
    freeCardsDelivered: {
      type: Number,
      required: true,
      min: [1, 'Debe entregar al menos 1 cartón'],
      default: 5,
    },
    freeCardsToSelect: {
      type: Number,
      required: true,
      min: [1, 'El jugador debe seleccionar al menos 1 cartón'],
      default: 2,
    },
    maxCardsToBuy: {
      type: Number,
      required: true,
      min: [1, 'Máximo cartones a comprar debe ser al menos 1'],
      default: 10,
    },
    paidCardsToIssue: {
      type: Number,
      required: true,
      min: [1, 'Cartones a entregar (pago) debe ser al menos 1'],
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const GeneralParametersModel: Model<GeneralParametersDocument> =
  mongoose.models.GeneralParameters ||
  mongoose.model<GeneralParametersDocument>('GeneralParameters', GeneralParametersSchema);

export { GeneralParametersSchema, GeneralParametersModel };
