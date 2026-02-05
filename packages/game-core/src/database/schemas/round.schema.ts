import { Schema, Document, Model } from 'mongoose';
import { mongoose } from '../connection';

export interface RoundDocument extends Document {
  name: string;
  cardSize: number;
  minNumber: number;
  maxNumber: number;
  gamePattern: 'linea' | 'columna' | 'diagonal' | 'completo' | 'figura_especial';
  startMode: 'manual' | 'automatico';
  autoStartDelay?: number;
  status: 'configurada' | 'en_progreso' | 'finalizada' | 'cancelada';
  createdBy: mongoose.Types.ObjectId;
  drawnNumbers: number[];
  cardBunchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoundSchema = new Schema<RoundDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la ronda es requerido'],
      trim: true,
    },
    cardSize: {
      type: Number,
      required: [true, 'El tamano de la carta es requerido'],
      min: [3, 'El tamano minimo es 3'],
      max: [10, 'El tamano maximo es 10'],
    },
    minNumber: {
      type: Number,
      required: [true, 'El numero minimo es requerido'],
      min: [1, 'El numero minimo debe ser al menos 1'],
      default: 1,
    },
    maxNumber: {
      type: Number,
      required: [true, 'El numero maximo es requerido'],
      min: [1, 'El numero maximo debe ser al menos 1'],
    },
    gamePattern: {
      type: String,
      enum: ['linea', 'columna', 'diagonal', 'completo', 'figura_especial'],
      required: [true, 'El patron de juego es requerido'],
    },
    startMode: {
      type: String,
      enum: ['manual', 'automatico'],
      required: [true, 'El modo de inicio es requerido'],
    },
    autoStartDelay: {
      type: Number,
      min: [1, 'El tiempo minimo es 1 segundo'],
    },
    status: {
      type: String,
      enum: ['configurada', 'en_progreso', 'finalizada', 'cancelada'],
      default: 'configurada',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    drawnNumbers: {
      type: [Number],
      default: [],
    },
    cardBunchId: {
      type: Schema.Types.ObjectId,
      ref: 'CardBunch',
    },
  },
  {
    timestamps: true,
  }
);

RoundSchema.pre('save', function () {
  const totalCells = this.cardSize * this.cardSize;
  const availableNumbers = this.maxNumber - this.minNumber + 1;
  if (availableNumbers < totalCells) {
    throw new Error(
      `Debe haber al menos ${totalCells} numeros para una carta de ${this.cardSize}x${this.cardSize}`
    );
  }
});

const RoundModel: Model<RoundDocument> =
  mongoose.models.Round || mongoose.model<RoundDocument>('Round', RoundSchema);

export { RoundSchema, RoundModel };
